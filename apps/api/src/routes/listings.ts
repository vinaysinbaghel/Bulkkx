import { Router, Request, Response } from 'express';
import { store } from '../store/memory-store';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  Listing,
  validateAttributesAgainstTemplate,
  sanitizeListingForBuyer,
  toPaise,
} from '@bulkkx/shared';

export const listingsRouter = Router();

// GET listings (filtered, sanitized with zero-leak masking for buyers)
listingsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { categoryId, status = 'active' } = req.query;
  const isSupplierViewingOwn = req.user?.role === 'supplier';

  let list = Array.from(store.listings.values());

  if (categoryId) {
    list = list.filter((l) => l.categoryId === categoryId);
  }

  if (status) {
    list = list.filter((l) => l.status === status);
  }

  // If supplier is viewing, they can see their own full details
  if (isSupplierViewingOwn) {
    const ownListings = list.filter((l) => l.supplierId === req.user?.id);
    res.json({ listings: ownListings });
    return;
  }

  // Buyers & public view: STRICT ZERO-LEAK SANITIZATION
  const sanitized = list.map((l) => sanitizeListingForBuyer(l));
  res.json({ listings: sanitized });
});

// GET single listing
listingsRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const listing = store.listings.get(req.params.id);
  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }

  if (req.user?.role === 'supplier' && listing.supplierId === req.user?.id) {
    res.json({ listing });
    return;
  }

  res.json({ listing: sanitizeListingForBuyer(listing) });
});

// POST create listing (Supplier)
listingsRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const supplierId = req.user?.id || 'sup-001';
  const supplierParty = store.parties.get(supplierId);

  if (!supplierParty) {
    res.status(403).json({ error: 'Supplier profile not found' });
    return;
  }

  const {
    categoryId,
    attributes,
    quantityAvailable,
    minOrderQuantity,
    unit = 'MT',
    pricePaise,
    priceInr,
    lockValidityHours = 24,
    leadTimeDays = 3,
    termsNote,
  } = req.body;

  const category = store.categories.get(categoryId);
  if (!category) {
    res.status(400).json({ error: 'Invalid category' });
    return;
  }

  const template = store.templates.get(category.activeTemplateId);
  if (!template) {
    res.status(400).json({ error: 'Active template not found for category' });
    return;
  }

  // Validate dynamic attributes against category template
  const validation = validateAttributesAgainstTemplate(attributes || {}, template);
  if (!validation.valid) {
    res.status(400).json({
      error: 'Template attribute validation failed',
      details: validation.errors,
    });
    return;
  }

  const finalPricePaise = pricePaise !== undefined ? pricePaise : toPaise(priceInr || 0);
  if (finalPricePaise <= 0) {
    res.status(400).json({ error: 'Price must be greater than zero' });
    return;
  }

  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + lockValidityHours * 3600 * 1000).toISOString();

  const newListing: Listing = {
    id: `list-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    supplierId,
    categoryId,
    templateId: template.id,
    templateVersion: template.version,
    attributes: attributes || {},
    quantityAvailable: Number(quantityAvailable),
    minOrderQuantity: Number(minOrderQuantity || 1),
    unit,
    location: supplierParty.address,
    priceSlabs: [{ minQty: Number(minOrderQuantity || 1), pricePaise: finalPricePaise }],
    lockedPricePaise: finalPricePaise,
    lockExpiresAt,
    leadTimeDays: Number(leadTimeDays),
    status: 'active',
    termsNote,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  store.listings.set(newListing.id, newListing);

  // Audit
  store.auditLogs.push({
    id: `audit-${Date.now()}`,
    actorId: supplierId,
    actorRole: 'supplier',
    action: 'CREATE_LISTING_WITH_PRICE_LOCK',
    entityType: 'listing',
    entityId: newListing.id,
    after: { lockedPricePaise: finalPricePaise, lockExpiresAt },
    timestamp: now.toISOString(),
  });

  res.status(201).json({
    success: true,
    message: 'Listing created and price locked successfully!',
    listing: newListing,
  });
});

// POST renew price lock
listingsRouter.post('/:id/renew-lock', (req: AuthenticatedRequest, res: Response) => {
  const listing = store.listings.get(req.params.id);
  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }

  const { validityHours = 24, newPricePaise } = req.body;
  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + validityHours * 3600 * 1000).toISOString();

  const oldPrice = listing.lockedPricePaise;
  if (newPricePaise) {
    listing.lockedPricePaise = newPricePaise;
  }
  listing.lockExpiresAt = lockExpiresAt;
  listing.status = 'active';
  listing.updatedAt = now.toISOString();

  // Audit
  store.auditLogs.push({
    id: `audit-${Date.now()}`,
    actorId: req.user?.id || 'supplier',
    actorRole: 'supplier',
    action: 'RENEW_PRICE_LOCK',
    entityType: 'listing',
    entityId: listing.id,
    before: { oldPrice },
    after: { price: listing.lockedPricePaise, lockExpiresAt },
    timestamp: now.toISOString(),
  });

  res.json({
    success: true,
    message: `Price lock extended by ${validityHours} hours`,
    listing,
  });
});

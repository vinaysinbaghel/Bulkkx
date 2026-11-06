import { Router, Request, Response } from 'express';
import { store } from '../store/memory-store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Requirement, matchRequirementToListings, toPaise } from '@bulkkx/shared';

export const requirementsRouter = Router();

// GET all requirements for current buyer
requirementsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const buyerId = req.user?.id || 'buy-001';
  const list = Array.from(store.requirements.values()).filter((r) => r.buyerId === buyerId);
  res.json({ requirements: list });
});

// GET single requirement with its shortlisted matches
requirementsRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const reqItem = store.requirements.get(req.params.id);
  if (!reqItem) {
    res.status(404).json({ error: 'Requirement not found' });
    return;
  }
  const matches = Array.from(store.matches.values()).filter((m) => m.requirementId === reqItem.id);
  res.json({ requirement: reqItem, matches });
});

// POST create requirement (Buyer)
requirementsRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const buyerId = req.user?.id || 'buy-001';
  const buyerParty = store.parties.get(buyerId);

  const {
    categoryId,
    specs = {},
    quantity,
    unit = 'MT',
    targetPriceInr,
    targetPricePaise,
    neededByDays = 7,
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

  const now = new Date();
  const neededByDate = new Date(now.getTime() + neededByDays * 24 * 3600 * 1000).toISOString();

  const finalTargetPricePaise = targetPricePaise || (targetPriceInr ? toPaise(targetPriceInr) : undefined);

  const newRequirement: Requirement = {
    id: `req-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    buyerId,
    categoryId,
    specs,
    quantity: Number(quantity),
    unit,
    deliveryLocation: buyerParty?.address || {
      line1: 'Industrial Area',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110020',
    },
    neededByDate,
    targetPricePaise: finalTargetPricePaise,
    status: 'open',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  store.requirements.set(newRequirement.id, newRequirement);

  // Automatically trigger deterministic matching against active listings
  const allListings = Array.from(store.listings.values());
  const matchResult = matchRequirementToListings(
    newRequirement,
    allListings,
    template,
    buyerParty?.buyerTier || 'bronze'
  );

  // Store top matches for Ops review / buyer shortlist
  for (const m of matchResult.matches) {
    store.matches.set(m.id, m);
  }

  // Audit
  store.auditLogs.push({
    id: `audit-${Date.now()}`,
    actorId: buyerId,
    actorRole: 'buyer',
    action: 'POST_REQUIREMENT',
    entityType: 'requirement',
    entityId: newRequirement.id,
    after: { quantity: newRequirement.quantity, matchesCount: matchResult.matches.length },
    timestamp: now.toISOString(),
  });

  res.status(201).json({
    success: true,
    message: 'Requirement posted and matching engine triggered!',
    requirement: newRequirement,
    matchCount: matchResult.matches.length,
    matches: matchResult.matches,
  });
});

import { Router, Response } from 'express';
import { store } from '../store/memory-store';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  Deal,
  DealEvent,
  transitionDeal,
  maskDealForBuyer,
  maskDealForSupplier,
  calculateDealBreakdown,
  LedgerEntry,
} from '@bulkkx/shared';
import { SimulatedNotificationAdapter } from '@bulkkx/adapters';

export const dealsRouter = Router();
const notificationAdapter = new SimulatedNotificationAdapter();

// GET all deals with strict identity masking based on user role
dealsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || 'buy-001';
  const role = req.user?.role || 'buyer';

  let list = Array.from(store.deals.values());

  if (role === 'buyer') {
    list = list.filter((d) => d.buyerId === currentUserId);
    const masked = list.map((d) => {
      const supplierParty = store.parties.get(d.supplierId);
      if (!supplierParty) return d;
      return maskDealForBuyer(d, supplierParty);
    });
    res.json({ deals: masked });
    return;
  }

  if (role === 'supplier') {
    list = list.filter((d) => d.supplierId === currentUserId);
    const masked = list.map((d) => {
      const buyerParty = store.parties.get(d.buyerId);
      if (!buyerParty) return d;
      return maskDealForSupplier(d, buyerParty);
    });
    res.json({ deals: masked });
    return;
  }

  // Ops & Admin see unmasked deals
  res.json({ deals: list });
});

// GET single deal (Strictly masked)
dealsRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const deal = store.deals.get(req.params.id);
  if (!deal) {
    res.status(404).json({ error: 'Deal not found' });
    return;
  }

  const role = req.user?.role || 'buyer';

  if (role === 'buyer') {
    const supplierParty = store.parties.get(deal.supplierId);
    if (!supplierParty) {
      res.json({ deal });
      return;
    }
    res.json({ deal: maskDealForBuyer(deal, supplierParty) });
    return;
  }

  if (role === 'supplier') {
    const buyerParty = store.parties.get(deal.buyerId);
    if (!buyerParty) {
      res.json({ deal });
      return;
    }
    res.json({ deal: maskDealForSupplier(deal, buyerParty) });
    return;
  }

  // Ops / Admin
  res.json({ deal });
});

// POST create deal from a match
dealsRouter.post('/from-match', (req: AuthenticatedRequest, res: Response) => {
  const { matchId, reservePercentage = 10 } = req.body;
  const match = store.matches.get(matchId);

  if (!match) {
    res.status(404).json({ error: 'Match record not found' });
    return;
  }

  const listing = store.listings.get(match.listingId);
  const requirement = store.requirements.get(match.requirementId);

  if (!listing || !requirement) {
    res.status(400).json({ error: 'Associated listing or requirement not found' });
    return;
  }

  const breakdown = calculateDealBreakdown({
    unitPricePaise: listing.lockedPricePaise,
    quantity: requirement.quantity,
    discountPaise: match.discountPaise,
    reservePercentage,
    feePercentage: 2,
  });

  const now = new Date();
  const dealCode = `BX-2026-${Math.floor(Math.random() * 9000 + 1000)}`;

  const newDeal: Deal = {
    id: `deal-${Date.now()}`,
    dealCode,
    buyerId: requirement.buyerId,
    supplierId: listing.supplierId,
    listingId: listing.id,
    requirementId: requirement.id,
    categoryId: listing.categoryId,
    unitPricePaise: breakdown.unitPricePaise,
    quantity: breakdown.quantity,
    unit: listing.unit,
    totalGoodsValuePaise: breakdown.totalGoodsValuePaise,
    discountPaise: breakdown.discountPaise,
    effectiveTotalPaise: breakdown.effectiveTotalPaise,
    reservePercentage: breakdown.reservePercentage,
    reserveAmountPaise: breakdown.reserveAmountPaise,
    platformFeePaise: breakdown.platformFeePaise,
    state: 'matched',
    version: 1,
    listingSnapshot: {
      id: listing.id,
      attributes: listing.attributes,
      lockedPricePaise: listing.lockedPricePaise,
      unit: listing.unit,
      leadTimeDays: listing.leadTimeDays,
    },
    lockExpiresAt: listing.lockExpiresAt,
    supplierSlaExpiresAt: new Date(now.getTime() + 4 * 3600 * 1000).toISOString(), // 4h SLA for supplier confirmation
    stateHistory: [
      {
        fromState: undefined,
        toState: 'matched',
        event: 'BUYER_ACCEPT_TERMS',
        actorId: req.user?.id || requirement.buyerId,
        actorRole: req.user?.role || 'buyer',
        timestamp: now.toISOString(),
        note: 'Deal created from matched shortlist',
      },
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  store.deals.set(newDeal.id, newDeal);

  // Send WhatsApp alert to supplier: Match request waiting confirmation
  const supplierParty = store.parties.get(listing.supplierId);
  if (supplierParty) {
    notificationAdapter.sendWhatsApp({
      toPhone: supplierParty.phone,
      templateName: 'supplier_new_match_alert',
      params: {
        dealCode: newDeal.dealCode,
        quantity: `${newDeal.quantity} ${newDeal.unit}`,
        price: `₹${(newDeal.totalGoodsValuePaise / 100).toLocaleString('en-IN')}`,
      },
      deepLinkPath: `/deals/${newDeal.id}`,
    });
  }

  // Audit
  store.auditLogs.push({
    id: `audit-${Date.now()}`,
    actorId: req.user?.id || 'buyer',
    actorRole: 'buyer',
    action: 'CREATE_DEAL_FROM_MATCH',
    entityType: 'deal',
    entityId: newDeal.id,
    after: { dealCode, totalPaise: breakdown.effectiveTotalPaise },
    timestamp: now.toISOString(),
  });

  res.status(201).json({
    success: true,
    message: 'Deal initiated successfully in matched state',
    deal: newDeal,
  });
});

// POST transition deal via state machine
dealsRouter.post('/:id/events/:event', (req: AuthenticatedRequest, res: Response) => {
  const deal = store.deals.get(req.params.id);
  if (!deal) {
    res.status(404).json({ error: 'Deal not found' });
    return;
  }

  const event = req.params.event as DealEvent;
  const actor = {
    id: req.user?.id || deal.buyerId,
    role: req.user?.role || 'buyer',
  };

  const payload = {
    expectedVersion: Number(req.body.expectedVersion ?? deal.version),
    note: req.body.note,
    carrierName: req.body.carrierName,
    trackingNumber: req.body.trackingNumber,
    driverPhone: req.body.driverPhone,
    proofFileKeys: req.body.proofFileKeys,
    weighbridgeSlipKey: req.body.weighbridgeSlipKey,
    disputeReason: req.body.disputeReason,
    evidenceFileKeys: req.body.evidenceFileKeys,
    resolvedAction: req.body.resolvedAction,
    resolutionNote: req.body.resolutionNote,
    adjustedPricePaise: req.body.adjustedPricePaise,
  };

  try {
    const result = transitionDeal(deal, event, actor, payload);

    // Save updated deal in store
    store.deals.set(result.newDeal.id, result.newDeal);

    // Record audit log
    store.auditLogs.push(result.auditEntry);

    // Process append-only ledger entries if triggered
    if (result.ledgerMutationsRequired) {
      for (const mut of result.ledgerMutationsRequired) {
        const ledgerEntry: LedgerEntry = {
          id: `ldg-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
          dealId: deal.id,
          account: mut.type === 'reserve_funded' ? 'partner_reserve_holding' : 'bulkkx_fee_revenue',
          direction: mut.type === 'reserve_funded' ? 'DEBIT' : 'CREDIT',
          amountPaise: mut.amountPaise,
          type: mut.type as any,
          idempotencyKey: `idem-${deal.id}-${mut.type}-${result.newDeal.version}`,
          description: mut.description,
          timestamp: new Date().toISOString(),
        };
        store.ledger.push(ledgerEntry);
      }
    }

    // WhatsApp Notification Trigger
    const buyerParty = store.parties.get(deal.buyerId);
    if (buyerParty) {
      notificationAdapter.sendWhatsApp({
        toPhone: buyerParty.phone,
        templateName: 'deal_status_updated',
        params: {
          dealCode: deal.dealCode,
          newState: result.newDeal.state,
        },
        deepLinkPath: `/deals/${deal.id}`,
      });
    }

    res.json({
      success: true,
      eventTriggered: event,
      fromState: result.previousState,
      toState: result.newDeal.state,
      newVersion: result.newDeal.version,
      deal: result.newDeal,
    });
  } catch (err: any) {
    res.status(400).json({
      error: err.name || 'TransitionError',
      code: err.code || 'TRANSITION_FAILED',
      message: err.message,
    });
  }
});

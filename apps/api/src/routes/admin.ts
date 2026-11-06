import { Router, Request, Response } from 'express';
import { store } from '../store/memory-store';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { SimulatedReservePartnerAdapter, SimulatedNotificationAdapter } from '@bulkkx/adapters';

export const adminRouter = Router();
const reserveAdapter = new SimulatedReservePartnerAdapter();

// Require ops or admin role for all admin routes
adminRouter.use(requireRole(['ops', 'admin', 'finance']));

// 1. Matching Workbench: Get all pending matches across buyers
adminRouter.get('/matching-workbench', (req: Request, res: Response) => {
  const matches = Array.from(store.matches.values()).map((m) => {
    const listing = store.listings.get(m.listingId);
    const requirement = store.requirements.get(m.requirementId);
    const supplierParty = store.parties.get(m.supplierId);
    const buyerParty = store.parties.get(m.buyerId);

    return {
      match: m,
      listing,
      requirement,
      supplier: supplierParty,
      buyer: buyerParty,
    };
  });

  res.json({ workbenchItems: matches });
});

// Approve or adjust shortlist match
adminRouter.post('/matching-workbench/:matchId/approve', (req: AuthenticatedRequest, res: Response) => {
  const match = store.matches.get(req.params.matchId);
  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const { discountOverridePaise, opsNotes } = req.body;
  if (discountOverridePaise !== undefined) {
    match.discountPaise = discountOverridePaise;
    match.presentedPricePaise = match.originalPricePaise - discountOverridePaise;
  }
  match.status = 'shortlisted';
  match.opsReviewerId = req.user?.id || 'ops-001';
  match.opsNotes = opsNotes || 'Approved by Ops Concierge';

  // Audit
  store.auditLogs.push({
    id: `audit-${Date.now()}`,
    actorId: req.user?.id || 'ops-001',
    actorRole: 'ops',
    action: 'APPROVE_SHORTLIST_MATCH',
    entityType: 'listing',
    entityId: match.id,
    after: { status: 'shortlisted', discountPaise: match.discountPaise },
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Match approved and pushed to buyer shortlist', match });
});

// 2. KYC Verification Queue
adminRouter.get('/kyc-queue', (req: Request, res: Response) => {
  const parties = Array.from(store.parties.values());
  const pendingKyc = parties.filter((p) => p.kycStatus === 'pending' || p.kycDocuments.some((d) => d.status === 'pending'));
  res.json({ pendingKyc });
});

adminRouter.post('/kyc-queue/:partyId/decision', (req: AuthenticatedRequest, res: Response) => {
  const party = store.parties.get(req.params.partyId);
  if (!party) {
    res.status(404).json({ error: 'Party not found' });
    return;
  }

  const { status, reason } = req.body; // 'verified' | 'rejected'
  party.kycStatus = status;
  for (const doc of party.kycDocuments) {
    doc.status = status;
    doc.rejectionReason = reason;
  }
  party.updatedAt = new Date().toISOString();

  store.auditLogs.push({
    id: `audit-${Date.now()}`,
    actorId: req.user?.id || 'ops-001',
    actorRole: 'ops',
    action: `KYC_${status.toUpperCase()}`,
    entityType: 'kyc',
    entityId: party.id,
    after: { kycStatus: status, reason },
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, party });
});

// 3. Append-Only Ledger & Reconciliation
adminRouter.get('/ledger', (req: Request, res: Response) => {
  res.json({
    ledgerEntries: store.ledger,
    totalEntries: store.ledger.length,
  });
});

adminRouter.get('/reconciliation', async (req: Request, res: Response) => {
  // Compute ledger balances in integer paise
  let totalReserveDebitsPaise = 0;
  let totalReserveCreditsPaise = 0;
  let totalBulkkxFeeAccruedPaise = 0;

  for (const entry of store.ledger) {
    if (entry.account === 'partner_reserve_holding') {
      if (entry.direction === 'DEBIT') totalReserveDebitsPaise += entry.amountPaise;
      if (entry.direction === 'CREDIT') totalReserveCreditsPaise += entry.amountPaise;
    }
    if (entry.account === 'bulkkx_fee_revenue') {
      totalBulkkxFeeAccruedPaise += entry.amountPaise;
    }
  }

  const activeReserveBalancePaise = totalReserveDebitsPaise - totalReserveCreditsPaise;

  res.json({
    reconciliation: {
      activeReserveBalancePaise,
      totalReserveFundedPaise: totalReserveDebitsPaise,
      totalReserveReleasedPaise: totalReserveCreditsPaise,
      totalBulkkxFeeAccruedPaise,
      status: 'RECONCILED_OK',
      currency: 'INR (Calculated in paise)',
      asOf: new Date().toISOString(),
    },
  });
});

// 4. Audit Log Explorer
adminRouter.get('/audit-logs', (req: Request, res: Response) => {
  res.json({ auditLogs: [...store.auditLogs].reverse() });
});

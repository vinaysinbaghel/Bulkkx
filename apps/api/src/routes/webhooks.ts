import { Router, Request, Response } from 'express';
import { store } from '../store/memory-store';
import { SimulatedReservePartnerAdapter } from '@bulkkx/adapters';
import { transitionDeal, LedgerEntry } from '@bulkkx/shared';

export const webhooksRouter = Router();
const reserveAdapter = new SimulatedReservePartnerAdapter();

// Process partner webhook for reserve confirmation
webhooksRouter.post('/reserve', (req: Request, res: Response) => {
  const { partnerEventId, partnerRef, dealId, status, amountPaise, signature } = req.body;

  if (!dealId || !partnerRef) {
    res.status(400).json({ error: 'dealId and partnerRef are required' });
    return;
  }

  // 1. Verify cryptographic signature
  const isValidSig = reserveAdapter.verifyWebhookSignature(JSON.stringify(req.body), signature || 'mock_sig_valid');
  if (!isValidSig) {
    res.status(401).json({ error: 'Invalid partner webhook signature' });
    return;
  }

  const deal = store.deals.get(dealId);
  if (!deal) {
    res.status(404).json({ error: 'Deal not found for partner webhook' });
    return;
  }

  // Idempotency check: if already confirmed or passed, return 200 OK
  if (deal.state !== 'terms_accepted' && deal.state !== 'reserve_pending') {
    res.json({ success: true, message: 'Webhook already processed (Idempotent)' });
    return;
  }

  try {
    // If deal was terms_accepted, move through RESERVE_INITIATED then RESERVE_CONFIRMED
    let currentDeal = deal;
    if (currentDeal.state === 'terms_accepted') {
      const initResult = transitionDeal(
        currentDeal,
        'RESERVE_INITIATED',
        { id: 'reserve_partner_bot', role: 'admin' },
        { expectedVersion: currentDeal.version }
      );
      currentDeal = initResult.newDeal;
      store.deals.set(currentDeal.id, currentDeal);
    }

    // Now transition to RESERVE_CONFIRMED
    const confirmResult = transitionDeal(
      currentDeal,
      'RESERVE_CONFIRMED',
      { id: 'reserve_partner_webhook', role: 'admin' },
      { expectedVersion: currentDeal.version, note: `Reserve confirmed by Partner ref: ${partnerRef}` }
    );

    store.deals.set(confirmResult.newDeal.id, confirmResult.newDeal);
    store.auditLogs.push(confirmResult.auditEntry);

    // Record in double-entry append-only ledger
    const ledgerEntry: LedgerEntry = {
      id: `ldg-${Date.now()}`,
      dealId: deal.id,
      account: 'partner_reserve_holding',
      direction: 'DEBIT',
      amountPaise: amountPaise || deal.reserveAmountPaise,
      type: 'reserve_funded',
      idempotencyKey: `webhook-${partnerEventId || partnerRef}`,
      description: `Reserve funded by Partner. Deal ${deal.dealCode} confirmed. Identities unlocked.`,
      timestamp: new Date().toISOString(),
    };
    store.ledger.push(ledgerEntry);

    res.json({
      success: true,
      message: 'Reserve webhook processed successfully. Deal transitioned to reserve_confirmed.',
      dealState: confirmResult.newDeal.state,
      dealVersion: confirmResult.newDeal.version,
    });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to process reserve webhook', message: err.message });
  }
});

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import { Express } from 'express';

describe('BulkkX End-to-End API Critical Flows', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it('1. Fetches seed categories and active templates', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .set('x-user-id', 'buy-001')
      .set('x-user-role', 'buyer');

    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBeGreaterThanOrEqual(3);
    const wheatCat = res.body.categories.find((c: any) => c.id === 'cat-grains');
    expect(wheatCat).toBeDefined();
    expect(wheatCat.name).toBe('Grains & Cereals');
  });

  it('2. Supplier lists commodity with price lock', async () => {
    const res = await request(app)
      .post('/api/v1/listings')
      .set('x-user-id', 'sup-001')
      .set('x-user-role', 'supplier')
      .send({
        categoryId: 'cat-grains',
        quantityAvailable: 60,
        minOrderQuantity: 10,
        unit: 'MT',
        priceInr: 2650, // ₹2,650 / MT = 265000 paise
        lockValidityHours: 24,
        leadTimeDays: 2,
        attributes: {
          grade: 'Lokwan Grade 1',
          quantity: 60,
          unit: 'MT',
          packaging: 'pp_bags_50kg',
          leadTimeDays: 2,
          lockValidityHours: 24,
          variety: 'lokwan',
          moisturePercent: 11.0,
          foreignMatterPercent: 0.5,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.listing.lockedPricePaise).toBe(265000);
    expect(res.body.listing.status).toBe('active');
  });

  it('3. Buyer posts requirement and triggers matching algorithm', async () => {
    const res = await request(app)
      .post('/api/v1/requirements')
      .set('x-user-id', 'buy-001')
      .set('x-user-role', 'buyer')
      .send({
        categoryId: 'cat-grains',
        quantity: 20,
        unit: 'MT',
        targetPriceInr: 2700,
        specs: {
          variety: 'lokwan',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.matchCount).toBeGreaterThan(0);
    const firstMatch = res.body.matches[0];
    expect(firstMatch.matchScore).toBeGreaterThanOrEqual(70);
    expect(firstMatch.presentedPricePaise).toBeLessThanOrEqual(firstMatch.originalPricePaise);
  });

  it('4. Deal creation and strict identity masking prior to reserve', async () => {
    // 1. Post requirement
    const reqRes = await request(app)
      .post('/api/v1/requirements')
      .set('x-user-id', 'buy-001')
      .set('x-user-role', 'buyer')
      .send({
        categoryId: 'cat-grains',
        quantity: 15,
        unit: 'MT',
        specs: { variety: 'sharbati' },
      });

    const match = reqRes.body.matches[0];

    // 2. Create deal from match
    const dealRes = await request(app)
      .post('/api/v1/deals/from-match')
      .set('x-user-id', 'buy-001')
      .set('x-user-role', 'buyer')
      .send({ matchId: match.id, reservePercentage: 10 });

    expect(dealRes.status).toBe(201);
    const dealId = dealRes.body.deal.id;

    // 3. Buyer fetches deal: Verify supplier identity is strictly masked!
    const buyerViewRes = await request(app)
      .get(`/api/v1/deals/${dealId}`)
      .set('x-user-id', 'buy-001')
      .set('x-user-role', 'buyer');

    expect(buyerViewRes.status).toBe(200);
    expect(buyerViewRes.body.deal.isIdentityRevealed).toBe(false);
    expect(buyerViewRes.body.deal.supplier.legalName).toBeUndefined();
    expect(buyerViewRes.body.deal.supplier.phone).toBeUndefined();
    expect(buyerViewRes.body.deal.supplier.pseudonym).toContain('Supplier #');

    // 4. Supplier confirms deal (state -> supplier_confirmed)
    const confirmRes = await request(app)
      .post(`/api/v1/deals/${dealId}/events/SUPPLIER_CONFIRM`)
      .set('x-user-id', 'sup-001')
      .set('x-user-role', 'supplier')
      .send({ expectedVersion: 1 });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.toState).toBe('supplier_confirmed');

    // 5. Buyer accepts terms (state -> terms_accepted)
    const termsRes = await request(app)
      .post(`/api/v1/deals/${dealId}/events/BUYER_ACCEPT_TERMS`)
      .set('x-user-id', 'buy-001')
      .set('x-user-role', 'buyer')
      .send({ expectedVersion: 2 });
    expect(termsRes.status).toBe(200);
    expect(termsRes.body.toState).toBe('terms_accepted');

    // 6. Partner Webhook confirms reserve -> state moves to reserve_confirmed
    const webhookRes = await request(app)
      .post('/api/v1/webhooks/reserve')
      .send({
        partnerEventId: `evt-${Date.now()}`,
        partnerRef: 'NBFC-RES-998811',
        dealId,
        status: 'confirmed',
        amountPaise: 400000,
        signature: 'mock_sig_partner_verified',
      });
    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.dealState).toBe('reserve_confirmed');

    // 7. Identity is now legally unlocked!
    const unlockedView = await request(app)
      .get(`/api/v1/deals/${dealId}`)
      .set('x-user-id', 'buy-001')
      .set('x-user-role', 'buyer');
    expect(unlockedView.body.deal.isIdentityRevealed).toBe(true);
    expect(unlockedView.body.deal.supplier.legalName).toBe('Shree Balaji Agro Traders Pvt Ltd');
    expect(unlockedView.body.deal.supplier.phone).toBe('+919829012345');
  });

  it('5. Append-only ledger reconciliation verifies positive reserve balance', async () => {
    const reconRes = await request(app)
      .get('/api/v1/admin/reconciliation')
      .set('x-user-id', 'ops-001')
      .set('x-user-role', 'ops');

    expect(reconRes.status).toBe(200);
    expect(reconRes.body.reconciliation.status).toBe('RECONCILED_OK');
    expect(reconRes.body.reconciliation.totalReserveFundedPaise).toBeGreaterThan(0);
  });
});

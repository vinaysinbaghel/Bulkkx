import { describe, it, expect } from 'vitest';
import { transitionDeal, DealTransitionError } from '../state-machine/deal-machine';
import { Deal } from '../types/domain';
import { calculateDealBreakdown, toPaise, toINR, formatINR } from '../currency/paise';
import { maskDealForBuyer, maskDealForSupplier } from '../security/masking';
import { WHEAT_TEMPLATE, validateAttributesAgainstTemplate } from '../templates/engine';
import { matchRequirementToListings } from '../matching/engine';

describe('Currency & Integer Paise Math', () => {
  it('converts INR to integer paise correctly', () => {
    expect(toPaise(2450.5)).toBe(245050);
    expect(toPaise(0)).toBe(0);
    expect(toINR(245050)).toBe(2450.5);
  });

  it('formats INR into Indian currency format without float drift', () => {
    const formatted = formatINR(15000000); // 1,50,000 INR
    expect(formatted).toContain('1,50,000');
  });

  it('calculates deal breakdowns in integer paise accurately', () => {
    const breakdown = calculateDealBreakdown({
      unitPricePaise: 250000, // ₹2,500 per MT
      quantity: 100,          // 100 MT
      discountPaise: 500000,  // ₹5,000 discount
      reservePercentage: 10,  // 10%
      feePercentage: 2,       // 2%
    });

    expect(breakdown.totalGoodsValuePaise).toBe(25000000); // ₹2,50,000
    expect(breakdown.effectiveTotalPaise).toBe(24500000);  // ₹2,45,000
    expect(breakdown.reserveAmountPaise).toBe(2450000);    // ₹24,500 (10% of 2,45,000)
    expect(breakdown.platformFeePaise).toBe(500000);       // ₹5,000 (2% of 2,50,000)
  });
});

describe('Deal State Machine & Guardrails', () => {
  const baseDeal: Deal = {
    id: 'deal-001',
    dealCode: 'BX-2026-0001',
    buyerId: 'buyer-1',
    supplierId: 'supplier-1',
    listingId: 'list-1',
    requirementId: 'req-1',
    categoryId: 'cat-grains',
    unitPricePaise: 250000,
    quantity: 10,
    unit: 'MT',
    totalGoodsValuePaise: 2500000,
    discountPaise: 50000,
    effectiveTotalPaise: 2450000,
    reservePercentage: 10,
    reserveAmountPaise: 245000,
    platformFeePaise: 50000,
    state: 'matched',
    version: 1,
    listingSnapshot: {},
    lockExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    stateHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('allows supplier to confirm matched deal', () => {
    const result = transitionDeal(
      baseDeal,
      'SUPPLIER_CONFIRM',
      { id: 'supplier-1', role: 'supplier' },
      { expectedVersion: 1 }
    );

    expect(result.success).toBe(true);
    expect(result.newDeal.state).toBe('supplier_confirmed');
    expect(result.newDeal.version).toBe(2);
    expect(result.auditEntry.action).toBe('DEAL_TRANSITION_SUPPLIER_CONFIRM');
  });

  it('fails if non-supplier attempts SUPPLIER_CONFIRM', () => {
    expect(() => {
      transitionDeal(
        baseDeal,
        'SUPPLIER_CONFIRM',
        { id: 'buyer-1', role: 'buyer' },
        { expectedVersion: 1 }
      );
    }).toThrow(DealTransitionError);
  });

  it('rejects transition when optimistic version mismatches', () => {
    expect(() => {
      transitionDeal(
        baseDeal,
        'SUPPLIER_CONFIRM',
        { id: 'supplier-1', role: 'supplier' },
        { expectedVersion: 999 } // Mismatch!
      );
    }).toThrow('Optimistic locking error');
  });

  it('blocks transition when price lock has expired', () => {
    const expiredDeal: Deal = {
      ...baseDeal,
      lockExpiresAt: new Date(Date.now() - 3600 * 1000).toISOString(), // Expired 1 hour ago
    };

    expect(() => {
      transitionDeal(
        expiredDeal,
        'SUPPLIER_CONFIRM',
        { id: 'supplier-1', role: 'supplier' },
        { expectedVersion: 1 }
      );
    }).toThrow('Lock expired');
  });
});

describe('Zero-Leak Identity Masking', () => {
  const dummySupplier = {
    id: 'supplier-secret-999',
    userId: 'user-s',
    legalName: 'Agro Commercials Pvt Ltd',
    tradeName: 'Agro Hub',
    role: 'supplier' as const,
    entityType: 'company' as const,
    phone: '+919876543210',
    email: 'secret@agrohub.com',
    gstin: '24AAACA1234A1Z5',
    pan: 'AAACA1234A',
    kycStatus: 'verified' as const,
    kycDocuments: [],
    address: {
      line1: 'Plot 44, APMC Yard',
      city: 'Rajkot',
      state: 'Gujarat',
      pincode: '360001',
    },
    createdAt: '',
    updatedAt: '',
  };

  const dealBeforeReserve: Deal = {
    id: 'deal-101',
    dealCode: 'BX-2026-101',
    buyerId: 'buyer-001',
    supplierId: dummySupplier.id,
    listingId: 'list-001',
    requirementId: 'req-001',
    categoryId: 'cat-grains',
    unitPricePaise: 260000,
    quantity: 20,
    unit: 'MT',
    totalGoodsValuePaise: 5200000,
    discountPaise: 0,
    effectiveTotalPaise: 5200000,
    reservePercentage: 10,
    reserveAmountPaise: 520000,
    platformFeePaise: 104000,
    state: 'terms_accepted', // Before reserve_confirmed!
    version: 1,
    listingSnapshot: {},
    lockExpiresAt: new Date(Date.now() + 100000).toISOString(),
    stateHistory: [],
    createdAt: '',
    updatedAt: '',
  };

  it('masks supplier phone, legal name, GSTIN, and line1 address prior to reserve_confirmed', () => {
    const masked = maskDealForBuyer(dealBeforeReserve, dummySupplier);
    expect(masked.isIdentityRevealed).toBe(false);

    const supplierView = masked.supplier as any;
    expect(supplierView.legalName).toBeUndefined();
    expect(supplierView.phone).toBeUndefined();
    expect(supplierView.gstin).toBeUndefined();
    expect(supplierView.pseudonym).toContain('Supplier #GU');
    expect(supplierView.city).toBe('Rajkot');
  });

  it('unmasks supplier details once deal reaches reserve_confirmed', () => {
    const dealAfterReserve: Deal = {
      ...dealBeforeReserve,
      state: 'reserve_confirmed',
    };
    const unmasked = maskDealForBuyer(dealAfterReserve, dummySupplier);
    expect(unmasked.isIdentityRevealed).toBe(true);

    const supplierView = unmasked.supplier as any;
    expect(supplierView.legalName).toBe('Agro Commercials Pvt Ltd');
    expect(supplierView.phone).toBe('+919876543210');
    expect(supplierView.gstin).toBe('24AAACA1234A1Z5');
  });
});

describe('Category Template Validation', () => {
  it('validates wheat attributes against schema successfully', () => {
    const validWheat = {
      grade: 'Sharbati A1',
      quantity: 50,
      unit: 'MT',
      packaging: 'pp_bags_50kg',
      leadTimeDays: 3,
      lockValidityHours: 24,
      variety: 'sharbati',
      moisturePercent: 11.5,
      foreignMatterPercent: 1.0,
    };

    const result = validateAttributesAgainstTemplate(validWheat, WHEAT_TEMPLATE);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('catches missing required fields and out-of-range moisture', () => {
    const invalidWheat = {
      grade: 'Sharbati A1',
      // missing quantity & unit
      leadTimeDays: 3,
      variety: 'sharbati',
      moisturePercent: 18.5, // Exceeds max 14!
    };

    const result = validateAttributesAgainstTemplate(invalidWheat, WHEAT_TEMPLATE);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

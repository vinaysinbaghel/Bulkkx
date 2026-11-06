import {
  Party,
  Category,
  CategoryTemplate,
  Listing,
  Requirement,
  Match,
  Deal,
  LedgerEntry,
  AuditLog,
  NotificationRecord,
  SEED_CATEGORIES,
  WHEAT_TEMPLATE,
  CHILLI_TEMPLATE,
  POLYMER_TEMPLATE,
} from '@bulkkx/shared';

export class MemoryStore {
  parties = new Map<string, Party>();
  categories = new Map<string, Category>();
  templates = new Map<string, CategoryTemplate>();
  listings = new Map<string, Listing>();
  requirements = new Map<string, Requirement>();
  matches = new Map<string, Match>();
  deals = new Map<string, Deal>();
  ledger: LedgerEntry[] = [];
  auditLogs: AuditLog[] = [];
  notifications: NotificationRecord[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Seed Categories & Templates
    for (const cat of SEED_CATEGORIES) {
      this.categories.set(cat.id, cat);
    }
    this.templates.set(WHEAT_TEMPLATE.id, WHEAT_TEMPLATE);
    this.templates.set(CHILLI_TEMPLATE.id, CHILLI_TEMPLATE);
    this.templates.set(POLYMER_TEMPLATE.id, POLYMER_TEMPLATE);

    // 2. Seed Parties
    const supplier1: Party = {
      id: 'sup-001',
      userId: 'usr-sup-1',
      legalName: 'Shree Balaji Agro Traders Pvt Ltd',
      tradeName: 'Balaji Agro Mandi',
      role: 'supplier',
      entityType: 'company',
      phone: '+919829012345',
      email: 'trader@balajiagro.in',
      gstin: '24AAACB9021F1ZX',
      pan: 'AAACB9021F',
      kycStatus: 'verified',
      kycDocuments: [
        {
          id: 'kyc-doc-1',
          docType: 'gst_certificate',
          documentNumber: '24AAACB9021F1ZX',
          fileKey: 'kyc/gst_cert_sup1.pdf',
          status: 'verified',
          uploadedAt: '2026-10-15T10:00:00.000Z',
        },
      ],
      address: {
        line1: 'Shed 12, APMC Market Yard, Gondal Road',
        city: 'Rajkot',
        state: 'Gujarat',
        pincode: '360004',
      },
      bankDetails: {
        accountName: 'Shree Balaji Agro Traders Pvt Ltd',
        accountNumber: '••••••••4812',
        ifscCode: 'HDFC0001890',
        bankName: 'HDFC Bank',
        branch: 'Rajkot Main',
      },
      scorecard: {
        overallRating: 4.9,
        dealsFulfilled: 38,
        dealsCancelled: 0,
        lockHonourRate: 100,
        avgDispatchHours: 36,
        disputePercentage: 2.1,
      },
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    this.parties.set(supplier1.id, supplier1);

    const buyer1: Party = {
      id: 'buy-001',
      userId: 'usr-buy-1',
      legalName: 'Kalyan Flour Mills & Foods LLP',
      tradeName: 'Kalyan Foods',
      role: 'buyer',
      entityType: 'partnership',
      phone: '+919811098765',
      email: 'procurement@kalyanfoods.com',
      gstin: '07AABCK8741L1Z9',
      pan: 'AABCK8741L',
      kycStatus: 'verified',
      kycDocuments: [],
      buyerTier: 'gold',
      address: {
        line1: 'Industrial Area Phase 2, Okhla',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110020',
      },
      createdAt: '2026-10-02T00:00:00.000Z',
      updatedAt: '2026-10-02T00:00:00.000Z',
    };
    this.parties.set(buyer1.id, buyer1);

    const opsUser: Party = {
      id: 'ops-001',
      userId: 'usr-ops-1',
      legalName: 'BulkkX Operations Concierge',
      role: 'ops',
      entityType: 'company',
      phone: '+919999900000',
      email: 'ops@bulkkx.in',
      kycStatus: 'verified',
      kycDocuments: [],
      address: {
        line1: 'BulkkX HQ, Bandra Kurla Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
      },
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    this.parties.set(opsUser.id, opsUser);

    // 3. Seed Live Listings with valid price lock windows
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours lock

    const listing1: Listing = {
      id: 'list-001',
      supplierId: supplier1.id,
      categoryId: 'cat-grains',
      templateId: WHEAT_TEMPLATE.id,
      templateVersion: 1,
      attributes: {
        grade: 'Sharbati MP Premium',
        quantity: 120,
        unit: 'MT',
        packaging: 'pp_bags_50kg',
        leadTimeDays: 2,
        lockValidityHours: 24,
        variety: 'sharbati',
        moisturePercent: 11.2,
        foreignMatterPercent: 0.8,
        proteinPercent: 13.5,
      },
      quantityAvailable: 120,
      minOrderQuantity: 10,
      unit: 'MT',
      location: supplier1.address,
      priceSlabs: [
        { minQty: 10, maxQty: 49, pricePaise: 275000 }, // ₹2,750 / MT
        { minQty: 50, pricePaise: 268000 },             // ₹2,680 / MT
      ],
      lockedPricePaise: 268000, // ₹2,680 per MT in paise
      lockExpiresAt: lockExpiry.toISOString(),
      leadTimeDays: 2,
      status: 'active',
      termsNote: 'Standard Mandi QC slip provided. Ex-warehouse Rajkot.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.listings.set(listing1.id, listing1);

    const listing2: Listing = {
      id: 'list-002',
      supplierId: supplier1.id,
      categoryId: 'cat-spices',
      templateId: CHILLI_TEMPLATE.id,
      templateVersion: 1,
      attributes: {
        grade: 'Teja S17 Whole Stemless',
        quantity: 25,
        unit: 'Quintal',
        packaging: 'jute_bags_50kg',
        leadTimeDays: 3,
        lockValidityHours: 36,
        variety: 'teja_s17',
        stemStatus: 'stemless',
        heatPungencySHU: 75000,
        moisturePercent: 9.8,
      },
      quantityAvailable: 25,
      minOrderQuantity: 2,
      unit: 'Quintal',
      location: supplier1.address,
      priceSlabs: [{ minQty: 2, pricePaise: 1850000 }], // ₹18,500 / Quintal
      lockedPricePaise: 1850000,
      lockExpiresAt: new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString(),
      leadTimeDays: 3,
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.listings.set(listing2.id, listing2);

    // Initial audit entry
    this.auditLogs.push({
      id: 'audit-seed-1',
      actorId: 'system',
      actorRole: 'admin',
      action: 'SYSTEM_BOOTSTRAP_SEED',
      entityType: 'category',
      entityId: 'cat-grains',
      timestamp: now.toISOString(),
    });
  }
}

export const store = new MemoryStore();

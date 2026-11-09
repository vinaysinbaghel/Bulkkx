import { pgTable, text, timestamp, integer, bigint, boolean, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';

// User & Role Enums
export const userRoleEnum = pgEnum('user_role', ['buyer', 'supplier', 'ops', 'admin', 'finance']);
export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'in_review', 'approved', 'rejected']);
export const dealStateEnum = pgEnum('deal_state', [
  'matched',
  'supplier_confirmed',
  'terms_accepted',
  'reserve_pending',
  'reserve_confirmed',
  'in_fulfilment',
  'delivered',
  'inspection',
  'accepted',
  'disputed',
  'resolved',
  'reserve_released',
  'fee_settled',
  'closed',
  'lapsed',
  'withdrawn',
  'cancelled',
]);

export const ledgerDirectionEnum = pgEnum('ledger_direction', ['DEBIT', 'CREDIT']);

// Users & Parties
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: text('phone').notNull().unique(),
  email: text('email'),
  role: userRoleEnum('role').notNull().default('buyer'),
  legalName: text('legal_name').notNull(),
  tradeName: text('trade_name'),
  pan: text('pan'),
  gstin: text('gstin'),
  addresses: jsonb('addresses').notNull().default([]),
  kycStatus: kycStatusEnum('kyc_status').notNull().default('pending'),
  buyerTier: text('buyer_tier').default('bronze'),
  bankDetails: jsonb('bank_details'),
  passwordHash: text('password_hash'),
  totpSecret: text('totp_secret'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Categories & Dynamic Templates
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const categoryTemplates = pgTable('category_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  version: integer('version').notNull(),
  schema: jsonb('schema').notNull(), // JSON Schema with matchable, buyer_visible, shown_on_card
  isActive: boolean('is_active').default(true).notNull(),
  publishedBy: uuid('published_by').references(() => users.id),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
});

// Listings
export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id').references(() => users.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  templateVersion: integer('template_version').notNull(),
  attributes: jsonb('attributes').notNull(),
  quantity: integer('quantity').notNull(),
  availableQuantity: integer('available_quantity').notNull(),
  minOrderQuantity: integer('min_order_quantity').notNull(),
  unit: text('unit').notNull(),
  location: jsonb('location').notNull(),
  priceSlabs: jsonb('price_slabs').notNull().default([]),
  lockedPricePaise: bigint('locked_price_paise', { mode: 'number' }).notNull(),
  lockWindowHours: integer('lock_window_hours').notNull().default(24),
  lockExpiresAt: timestamp('lock_expires_at', { withTimezone: true }).notNull(),
  leadTimeDays: integer('lead_time_days').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Buyer Requirements
export const requirements = pgTable('requirements', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerId: uuid('buyer_id').references(() => users.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  spec: jsonb('spec').notNull(),
  quantity: integer('quantity').notNull(),
  deliveryLocation: jsonb('delivery_location').notNull(),
  neededByDate: timestamp('needed_by_date', { withTimezone: true }).notNull(),
  targetPricePaise: bigint('target_price_paise', { mode: 'number' }),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Deals (Single source of truth)
export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealCode: text('deal_code').notNull().unique(),
  buyerId: uuid('buyer_id').references(() => users.id).notNull(),
  supplierId: uuid('supplier_id').references(() => users.id).notNull(),
  listingId: uuid('listing_id').references(() => listings.id).notNull(),
  requirementId: uuid('requirement_id').references(() => requirements.id),
  listingSnapshot: jsonb('listing_snapshot').notNull(),
  pricePaise: bigint('price_paise', { mode: 'number' }).notNull(),
  discountPaise: bigint('discount_paise', { mode: 'number' }).notNull().default(0),
  reservePercentageBps: integer('reserve_percentage_bps').notNull().default(1000), // 1000 bps = 10%
  reserveAmountPaise: bigint('reserve_amount_paise', { mode: 'number' }).notNull(),
  platformFeePaise: bigint('platform_fee_paise', { mode: 'number' }).notNull(),
  state: dealStateEnum('state').notNull().default('matched'),
  version: integer('version').notNull().default(1), // Optimistic concurrency locking
  lockExpiresAt: timestamp('lock_expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Append-Only Financial Ledger (Paise, Double-Entry)
export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').references(() => deals.id),
  account: text('account').notNull(), // 'RESERVE_HELD', 'ESCROW_PARTNER', 'BULKKX_REVENUE', etc.
  direction: ledgerDirectionEnum('direction').notNull(),
  amountPaise: bigint('amount_paise', { mode: 'number' }).notNull(),
  type: text('type').notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Append-Only Audit Log
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id'),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// Transactional Outbox Table for Domain Events & pg-boss Dispatch
export const transactionalOutbox = pgTable('transactional_outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventName: text('event_name').notNull(),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'processed', 'failed'
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});

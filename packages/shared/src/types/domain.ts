export type UserRole = 'buyer' | 'supplier' | 'ops' | 'admin' | 'finance';

export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type BuyerTier = 'bronze' | 'silver' | 'gold';
export type EntityType = 'individual' | 'proprietorship' | 'company' | 'partnership';

export interface BankDetails {
  accountName: string;
  accountNumber: string; // Encrypted in DB / masked
  ifscCode: string;
  bankName: string;
  branch: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface Party {
  id: string;
  userId: string;
  legalName: string;
  tradeName?: string;
  role: UserRole;
  entityType: EntityType;
  phone: string;
  email: string;
  gstin?: string;
  pan?: string;
  kycStatus: KycStatus;
  kycDocuments: KycDocument[];
  address: Address;
  buyerTier?: BuyerTier;
  bankDetails?: BankDetails;
  scorecard?: SupplierScorecard;
  createdAt: string;
  updatedAt: string;
}

export interface KycDocument {
  id: string;
  docType: 'gst_certificate' | 'pan_card' | 'bank_cheque' | 'trade_license';
  documentNumber: string;
  fileKey: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
  verifiedAt?: string;
}

export interface SupplierScorecard {
  overallRating: number; // 1.0 to 5.0
  dealsFulfilled: number;
  dealsCancelled: number;
  lockHonourRate: number; // percentage 0-100
  avgDispatchHours: number;
  disputePercentage: number;
}

// ---------------- CATEGORY & TEMPLATES ---------------- //

export type FieldType = 'enum' | 'number' | 'range' | 'text' | 'boolean' | 'date';

export interface TemplateFieldOption {
  value: string;
  label: string;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  unit?: string; // e.g. "%", "MT", "MFI", "mm", "SHU"
  required: boolean;
  matchable: boolean;       // used by matching engine
  shownOnCard: boolean;     // visible on shortlist card
  buyerVisible: boolean;    // visible in preview
  requiredForTerms: boolean;// snapshotted in legal terms
  options?: TemplateFieldOption[]; // for enum
  min?: number;
  max?: number;
  description?: string;
  defaultValue?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  activeTemplateId: string;
  active: boolean;
  createdAt: string;
}

export interface CategoryTemplate {
  id: string;
  categoryId: string;
  version: number;
  name: string;
  description?: string;
  coreFields: TemplateField[]; // grade, quantity, unit, packaging, origin/location, lead time
  categoryFields: TemplateField[]; // category specific
  published: boolean;
  publishedAt?: string;
  createdBy: string;
}

// ---------------- LISTINGS & PRICE LOCK ---------------- //

export type ListingStatus = 'draft' | 'pending_approval' | 'active' | 'lock_expired' | 'paused' | 'sold_out';

export interface PriceSlab {
  minQty: number;
  maxQty?: number;
  pricePaise: number; // integer paise
}

export interface Listing {
  id: string;
  supplierId: string;
  categoryId: string;
  templateId: string;
  templateVersion: number;
  attributes: Record<string, any>;
  quantityAvailable: number;
  minOrderQuantity: number;
  unit: string; // "MT", "Quintal", "KG", etc.
  location: Address;
  priceSlabs: PriceSlab[];
  lockedPricePaise: number; // base locked price in paise
  lockExpiresAt: string;    // ISO timestamp
  leadTimeDays: number;
  status: ListingStatus;
  termsNote?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------- REQUIREMENTS ---------------- //

export type RequirementStatus = 'open' | 'shortlisted' | 'matched' | 'closed' | 'cancelled';

export interface Requirement {
  id: string;
  buyerId: string;
  categoryId: string;
  specs: Record<string, any>;
  quantity: number;
  unit: string;
  deliveryLocation: Address;
  neededByDate: string;
  targetPricePaise?: number; // optional buyer target
  status: RequirementStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------------- MATCHING ---------------- //

export type MatchStatus = 'pending_ops' | 'shortlisted' | 'rejected' | 'accepted_by_buyer';

export interface ScoreComponent {
  criterion: string; // "spec_match", "price", "lead_time", "supplier_scorecard", "distance"
  weight: number;
  score: number; // 0 - 100
  reason: string;
}

export interface Match {
  id: string;
  requirementId: string;
  listingId: string;
  supplierId: string;
  buyerId: string;
  matchScore: number; // 0 - 100
  scoreBreakdown: ScoreComponent[];
  originalPricePaise: number;
  discountPaise: number;
  presentedPricePaise: number; // originalPricePaise - discountPaise
  opsReviewerId?: string;
  opsNotes?: string;
  status: MatchStatus;
  createdAt: string;
}

// ---------------- DEALS & STATE MACHINE ---------------- //

export type DealState =
  | 'matched'
  | 'supplier_confirmed'
  | 'terms_accepted'
  | 'reserve_pending'
  | 'reserve_confirmed'
  | 'in_fulfilment'
  | 'delivered'
  | 'inspection'
  | 'accepted'
  | 'disputed'
  | 'resolved'
  | 'reserve_released'
  | 'fee_settled'
  | 'closed'
  | 'lapsed'
  | 'withdrawn'
  | 'cancelled';

export type DealEvent =
  | 'SUPPLIER_CONFIRM'
  | 'SUPPLIER_REJECT'
  | 'BUYER_ACCEPT_TERMS'
  | 'SUPPLIER_ACCEPT_TERMS'
  | 'RESERVE_INITIATED'
  | 'RESERVE_CONFIRMED'
  | 'MARK_DISPATCHED'
  | 'RECORD_DELIVERY'
  | 'BUYER_ACCEPT'
  | 'BUYER_DISPUTE'
  | 'OPS_RESOLVE_DISPUTE'
  | 'RESERVE_RELEASED'
  | 'SETTLE_FEE'
  | 'EXPIRE_TIMEOUT'
  | 'CANCEL';

export interface DealStateHistoryEntry {
  fromState?: DealState;
  toState: DealState;
  event: DealEvent;
  actorId: string;
  actorRole: UserRole;
  timestamp: string;
  note?: string;
  metadata?: Record<string, any>;
}

export interface DealTermsSnapshot {
  termsVersionHash: string;
  agreedPricePaise: number;
  quantity: number;
  unit: string;
  discountPaise: number;
  reservePercentage: number;
  reserveAmountPaise: number;
  platformFeePaise: number;
  leadTimeDays: number;
  deliveryPincode: string;
  buyerAcceptedAt?: string;
  supplierAcceptedAt?: string;
  buyerDeviceInfo?: string;
  supplierDeviceInfo?: string;
  templateSnapshot: CategoryTemplate;
}

export interface Deal {
  id: string;
  dealCode: string; // e.g. "BX-2026-9042"
  buyerId: string;
  supplierId: string;
  listingId: string;
  requirementId: string;
  categoryId: string;
  
  // Financials in integer paise
  unitPricePaise: number;
  quantity: number;
  unit: string;
  totalGoodsValuePaise: number;
  discountPaise: number;
  effectiveTotalPaise: number;
  reservePercentage: number; // e.g., 10% = 1000 basis points or 10
  reserveAmountPaise: number;
  platformFeePaise: number; // e.g., 2% of totalGoodsValuePaise
  
  state: DealState;
  version: number; // For optimistic concurrency
  
  termsSnapshot?: DealTermsSnapshot;
  listingSnapshot: Partial<Listing>;
  
  // Timers & SLAs
  lockExpiresAt: string;
  supplierSlaExpiresAt?: string;
  fundingExpiresAt?: string;
  inspectionExpiresAt?: string;
  
  // Tracking
  dispatchInfo?: {
    trackingNumber?: string;
    carrierName?: string;
    dispatchedAt: string;
    driverPhone?: string;
  };
  deliveryProof?: {
    deliveredAt: string;
    proofFileKeys: string[];
    weighbridgeSlipKey?: string;
    acknowledgedBy: string;
  };
  disputeInfo?: {
    disputeReason: string;
    evidenceFileKeys: string[];
    raisedAt: string;
    resolutionNote?: string;
    resolvedAction?: 'release_full' | 'refund_full' | 'partial_settlement';
    adjustedPricePaise?: number;
    resolvedAt?: string;
  };
  
  stateHistory: DealStateHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// ---------------- RESERVE & LEDGER ---------------- //

export type ReserveType = 'cash' | 'credit';
export type ReserveStatus = 'pending' | 'confirmed' | 'released' | 'refunded' | 'failed';

export interface Reserve {
  id: string;
  dealId: string;
  partnerRef: string;
  partnerName: string; // e.g. "HDFC_ESCROW_SANDBOX", "NBFC_CREDIT_LINE"
  type: ReserveType;
  amountPaise: number;
  status: ReserveStatus;
  consentRecordId: string;
  createdAt: string;
  updatedAt: string;
}

export type LedgerAccount =
  | 'partner_reserve_holding'
  | 'bulkkx_fee_receivable'
  | 'bulkkx_fee_revenue'
  | 'bulkkx_discount_expense'
  | 'supplier_receivable'
  | 'buyer_security_deposit';

export type LedgerDirection = 'DEBIT' | 'CREDIT';

export interface LedgerEntry {
  id: string;
  dealId: string;
  account: LedgerAccount;
  direction: LedgerDirection;
  amountPaise: number;
  type: 'reserve_funded' | 'reserve_released' | 'reserve_refunded' | 'fee_invoiced' | 'discount_applied';
  idempotencyKey: string;
  description: string;
  timestamp: string;
}

// ---------------- AUDIT & NOTIFICATIONS ---------------- //

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  entityType: 'deal' | 'listing' | 'requirement' | 'category' | 'kyc' | 'reserve' | 'template';
  entityId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface NotificationRecord {
  id: string;
  recipientId: string;
  recipientPhone?: string;
  recipientEmail?: string;
  channel: 'whatsapp' | 'sms' | 'email';
  templateName: string;
  params: Record<string, string>;
  deepLink: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
}

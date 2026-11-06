import { Deal, DealEvent, DealState, UserRole, DealStateHistoryEntry, AuditLog } from '../types/domain';

export interface TransitionActor {
  id: string;
  role: UserRole;
  name?: string;
}

export interface TransitionPayload {
  expectedVersion: number;
  note?: string;
  metadata?: Record<string, any>;
  agreedPricePaise?: number;
  trackingNumber?: string;
  carrierName?: string;
  driverPhone?: string;
  proofFileKeys?: string[];
  weighbridgeSlipKey?: string;
  disputeReason?: string;
  evidenceFileKeys?: string[];
  resolvedAction?: 'release_full' | 'refund_full' | 'partial_settlement';
  resolutionNote?: string;
  adjustedPricePaise?: number;
}

export interface TransitionResult {
  success: boolean;
  newDeal: Deal;
  previousState: DealState;
  auditEntry: AuditLog;
  domainEvent: {
    eventName: string;
    dealId: string;
    payload: Record<string, any>;
  };
  ledgerMutationsRequired?: Array<{
    type: string;
    amountPaise: number;
    description: string;
  }>;
}

export class DealTransitionError extends Error {
  constructor(message: string, public code: 'INVALID_TRANSITION' | 'VERSION_MISMATCH' | 'UNAUTHORIZED' | 'LOCK_EXPIRED' | 'GUARD_FAILED') {
    super(message);
    this.name = 'DealTransitionError';
  }
}

/**
 * Deal state machine transition table:
 * maps currentState -> allowed events -> next state + required role
 */
export const STATE_TRANSITIONS: Record<
  DealState,
  Partial<Record<DealEvent, { nextState: DealState; allowedRoles: UserRole[]; requiresValidLock?: boolean }>>
> = {
  matched: {
    SUPPLIER_CONFIRM: { nextState: 'supplier_confirmed', allowedRoles: ['supplier'], requiresValidLock: true },
    SUPPLIER_REJECT: { nextState: 'withdrawn', allowedRoles: ['supplier'] },
    EXPIRE_TIMEOUT: { nextState: 'lapsed', allowedRoles: ['ops', 'admin'] },
    CANCEL: { nextState: 'cancelled', allowedRoles: ['buyer', 'ops', 'admin'] },
  },
  supplier_confirmed: {
    BUYER_ACCEPT_TERMS: { nextState: 'terms_accepted', allowedRoles: ['buyer'], requiresValidLock: true },
    EXPIRE_TIMEOUT: { nextState: 'lapsed', allowedRoles: ['ops', 'admin'] },
    CANCEL: { nextState: 'cancelled', allowedRoles: ['buyer', 'ops', 'admin'] },
  },
  terms_accepted: {
    RESERVE_INITIATED: { nextState: 'reserve_pending', allowedRoles: ['buyer', 'ops', 'admin'] },
    EXPIRE_TIMEOUT: { nextState: 'lapsed', allowedRoles: ['ops', 'admin'] },
    CANCEL: { nextState: 'cancelled', allowedRoles: ['buyer', 'ops', 'admin'] },
  },
  reserve_pending: {
    RESERVE_CONFIRMED: { nextState: 'reserve_confirmed', allowedRoles: ['ops', 'admin'] }, // Triggered by partner webhook
    EXPIRE_TIMEOUT: { nextState: 'lapsed', allowedRoles: ['ops', 'admin'] },
  },
  reserve_confirmed: {
    MARK_DISPATCHED: { nextState: 'in_fulfilment', allowedRoles: ['supplier'] },
    SUPPLIER_REJECT: { nextState: 'withdrawn', allowedRoles: ['supplier', 'ops', 'admin'] }, // Penalty applies
  },
  in_fulfilment: {
    RECORD_DELIVERY: { nextState: 'delivered', allowedRoles: ['supplier', 'ops', 'admin'] },
  },
  delivered: {
    // Delivery automatically enters inspection window
    EXPIRE_TIMEOUT: { nextState: 'inspection', allowedRoles: ['ops', 'admin'] },
    BUYER_ACCEPT: { nextState: 'accepted', allowedRoles: ['buyer'] },
    BUYER_DISPUTE: { nextState: 'disputed', allowedRoles: ['buyer'] },
  },
  inspection: {
    BUYER_ACCEPT: { nextState: 'accepted', allowedRoles: ['buyer'] },
    BUYER_DISPUTE: { nextState: 'disputed', allowedRoles: ['buyer'] },
    EXPIRE_TIMEOUT: { nextState: 'accepted', allowedRoles: ['ops', 'admin'] }, // Auto-accepts after 48h
  },
  accepted: {
    RESERVE_RELEASED: { nextState: 'reserve_released', allowedRoles: ['ops', 'admin'] }, // adapter callback
  },
  disputed: {
    OPS_RESOLVE_DISPUTE: { nextState: 'resolved', allowedRoles: ['ops', 'admin'] },
  },
  resolved: {
    RESERVE_RELEASED: { nextState: 'reserve_released', allowedRoles: ['ops', 'admin'] },
    CANCEL: { nextState: 'closed', allowedRoles: ['ops', 'admin'] },
  },
  reserve_released: {
    SETTLE_FEE: { nextState: 'fee_settled', allowedRoles: ['ops', 'admin', 'finance'] },
  },
  fee_settled: {
    EXPIRE_TIMEOUT: { nextState: 'closed', allowedRoles: ['ops', 'admin'] },
  },
  closed: {},
  lapsed: {},
  withdrawn: {},
  cancelled: {},
};

/**
 * Executes a deterministic state machine transition with optimistic locking & audit emission.
 */
export function transitionDeal(
  deal: Readonly<Deal>,
  event: DealEvent,
  actor: TransitionActor,
  payload: TransitionPayload
): TransitionResult {
  // 1. Optimistic Locking Check
  if (deal.version !== payload.expectedVersion) {
    throw new DealTransitionError(
      `Optimistic locking error: Deal is at version ${deal.version}, but client expected version ${payload.expectedVersion}. Refresh and retry.`,
      'VERSION_MISMATCH'
    );
  }

  // 2. Validate transition exists
  const currentTransitions = STATE_TRANSITIONS[deal.state];
  const transitionConfig = currentTransitions ? currentTransitions[event] : undefined;

  if (!transitionConfig) {
    throw new DealTransitionError(
      `Invalid transition: Event '${event}' is not permitted from current deal state '${deal.state}'.`,
      'INVALID_TRANSITION'
    );
  }

  // 3. Role Authorization Guard
  if (!transitionConfig.allowedRoles.includes(actor.role)) {
    throw new DealTransitionError(
      `Unauthorized: Role '${actor.role}' cannot trigger event '${event}'. Allowed roles: ${transitionConfig.allowedRoles.join(', ')}`,
      'UNAUTHORIZED'
    );
  }

  // If actor is buyer or supplier, ensure they match this deal
  if (actor.role === 'buyer' && actor.id !== deal.buyerId) {
    throw new DealTransitionError(`Unauthorized: Actor does not match buyer of this deal`, 'UNAUTHORIZED');
  }
  if (actor.role === 'supplier' && actor.id !== deal.supplierId) {
    throw new DealTransitionError(`Unauthorized: Actor does not match supplier of this deal`, 'UNAUTHORIZED');
  }

  // 4. Lock Expiry Guard (if required)
  const now = new Date();
  if (transitionConfig.requiresValidLock) {
    const lockExpiry = new Date(deal.lockExpiresAt);
    if (now > lockExpiry) {
      throw new DealTransitionError(
        `Lock expired: The price lock expired on ${lockExpiry.toISOString()}. Deal cannot proceed.`,
        'LOCK_EXPIRED'
      );
    }
  }

  const previousState = deal.state;
  const nextState = transitionConfig.nextState;

  // 5. Construct updated deal clone
  const updatedDeal: Deal = {
    ...deal,
    state: nextState,
    version: deal.version + 1,
    updatedAt: now.toISOString(),
    stateHistory: [
      ...deal.stateHistory,
      {
        fromState: previousState,
        toState: nextState,
        event,
        actorId: actor.id,
        actorRole: actor.role,
        timestamp: now.toISOString(),
        note: payload.note,
        metadata: payload.metadata,
      },
    ],
  };

  // State-specific side effect updates
  const ledgerMutations: TransitionResult['ledgerMutationsRequired'] = [];

  if (event === 'RESERVE_CONFIRMED') {
    ledgerMutations.push({
      type: 'reserve_funded',
      amountPaise: deal.reserveAmountPaise,
      description: `Reserve funded by partner webhook: ${deal.dealCode}`,
    });
  }

  if (event === 'MARK_DISPATCHED') {
    updatedDeal.dispatchInfo = {
      carrierName: payload.carrierName,
      trackingNumber: payload.trackingNumber,
      driverPhone: payload.driverPhone,
      dispatchedAt: now.toISOString(),
    };
  }

  if (event === 'RECORD_DELIVERY') {
    updatedDeal.deliveryProof = {
      deliveredAt: now.toISOString(),
      proofFileKeys: payload.proofFileKeys || [],
      weighbridgeSlipKey: payload.weighbridgeSlipKey,
      acknowledgedBy: actor.id,
    };
    // Default 48h inspection window
    const inspectionExpiry = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    updatedDeal.inspectionExpiresAt = inspectionExpiry.toISOString();
    // Move immediately to inspection if recorded delivery
    updatedDeal.state = 'inspection';
  }

  if (event === 'BUYER_DISPUTE') {
    if (!payload.disputeReason) {
      throw new DealTransitionError('A valid dispute reason and evidence are required', 'GUARD_FAILED');
    }
    updatedDeal.disputeInfo = {
      disputeReason: payload.disputeReason,
      evidenceFileKeys: payload.evidenceFileKeys || [],
      raisedAt: now.toISOString(),
    };
  }

  if (event === 'OPS_RESOLVE_DISPUTE') {
    if (updatedDeal.disputeInfo) {
      updatedDeal.disputeInfo.resolutionNote = payload.resolutionNote || 'Resolved by Ops';
      updatedDeal.disputeInfo.resolvedAction = payload.resolvedAction || 'release_full';
      updatedDeal.disputeInfo.adjustedPricePaise = payload.adjustedPricePaise;
      updatedDeal.disputeInfo.resolvedAt = now.toISOString();
    }
  }

  if (event === 'RESERVE_RELEASED') {
    ledgerMutations.push({
      type: 'reserve_released',
      amountPaise: deal.reserveAmountPaise,
      description: `Reserve released after buyer acceptance / ops resolution: ${deal.dealCode}`,
    });
  }

  if (event === 'SETTLE_FEE') {
    ledgerMutations.push({
      type: 'fee_invoiced',
      amountPaise: deal.platformFeePaise,
      description: `Platform fee invoiced to supplier post-fulfilment: ${deal.dealCode}`,
    });
  }

  // 6. Build Audit Log
  const auditEntry: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actorId: actor.id,
    actorRole: actor.role,
    action: `DEAL_TRANSITION_${event}`,
    entityType: 'deal',
    entityId: deal.id,
    before: { state: previousState, version: deal.version },
    after: { state: updatedDeal.state, version: updatedDeal.version },
    timestamp: now.toISOString(),
  };

  return {
    success: true,
    newDeal: updatedDeal,
    previousState,
    auditEntry,
    domainEvent: {
      eventName: `DealStateChanged_${nextState}`,
      dealId: deal.id,
      payload: {
        dealCode: deal.dealCode,
        fromState: previousState,
        toState: nextState,
        actorId: actor.id,
      },
    },
    ledgerMutationsRequired: ledgerMutations.length > 0 ? ledgerMutations : undefined,
  };
}

import { setup, createMachine } from 'xstate';
import { DealState, UserRole } from '../types/domain';

/**
 * Deal-state UI contract (Section 12)
 * One shared configuration keyed by deal state with a label, plain-language description,
 * who acts next, the SLA and the primary action for each role.
 * Read by both apps (web and admin) so screens never drift from the state machine.
 */
export interface DealStateUIContract {
  state: DealState;
  label: string;
  description: string;
  whoActsNext: UserRole | 'none';
  defaultSlaHours?: number;
  primaryAction: {
    buyer?: { label: string; action: string };
    supplier?: { label: string; action: string };
    ops?: { label: string; action: string };
  };
}

export const DEAL_STATE_UI_CONTRACT: Record<DealState, DealStateUIContract> = {
  matched: {
    state: 'matched',
    label: 'Match Found',
    description: 'A matching buyer requirement has been paired with a live supplier price-lock.',
    whoActsNext: 'supplier',
    defaultSlaHours: 4,
    primaryAction: {
      supplier: { label: 'Confirm Stock & Lock', action: 'SUPPLIER_CONFIRM' },
      buyer: { label: 'Waiting for Supplier Confirmation', action: 'VIEW' },
      ops: { label: 'Review Match', action: 'REVIEW' },
    },
  },
  supplier_confirmed: {
    state: 'supplier_confirmed',
    label: 'Supplier Confirmed',
    description: 'Supplier has confirmed availability and honoured the spot price lock.',
    whoActsNext: 'buyer',
    defaultSlaHours: 12,
    primaryAction: {
      buyer: { label: 'Review & Accept Terms', action: 'BUYER_ACCEPT_TERMS' },
      supplier: { label: 'Awaiting Buyer Acceptance', action: 'VIEW' },
      ops: { label: 'Monitor Acceptance Window', action: 'VIEW' },
    },
  },
  terms_accepted: {
    state: 'terms_accepted',
    label: 'Terms Agreed',
    description: 'Both parties accepted legal deal terms. Initiating Bank/NBFC reserve.',
    whoActsNext: 'buyer',
    defaultSlaHours: 2,
    primaryAction: {
      buyer: { label: 'Fund Bank Escrow Reserve', action: 'FUND_RESERVE' },
      supplier: { label: 'Awaiting Reserve Deposit', action: 'VIEW' },
      ops: { label: 'Escrow Pipeline Check', action: 'VIEW' },
    },
  },
  reserve_pending: {
    state: 'reserve_pending',
    label: 'Escrow Reserve Pending',
    description: 'Reserve transaction created with partner bank/NBFC. Awaiting confirmation webhook.',
    whoActsNext: 'ops',
    defaultSlaHours: 2,
    primaryAction: {
      buyer: { label: 'Reserve Authorizing with Bank', action: 'VIEW' },
      supplier: { label: 'Reserve Authorizing', action: 'VIEW' },
      ops: { label: 'Reconcile Webhook', action: 'RECONCILE' },
    },
  },
  reserve_confirmed: {
    state: 'reserve_confirmed',
    label: 'Reserve Funded (Zero-Leak Lifted)',
    description: '10% bank escrow confirmed. Trader identities revealed. Stock held for dispatch.',
    whoActsNext: 'supplier',
    defaultSlaHours: 24,
    primaryAction: {
      supplier: { label: 'Dispatch & Upload Bilty/LR', action: 'MARK_DISPATCHED' },
      buyer: { label: 'Awaiting Consignment Dispatch', action: 'VIEW' },
      ops: { label: 'Verify Transport Documentation', action: 'VIEW' },
    },
  },
  in_fulfilment: {
    state: 'in_fulfilment',
    label: 'In Transit',
    description: 'Commodity is in transit. Proof of dispatch and tracking active.',
    whoActsNext: 'supplier',
    defaultSlaHours: 72,
    primaryAction: {
      supplier: { label: 'Upload Proof of Delivery', action: 'RECORD_DELIVERY' },
      buyer: { label: 'Track Shipment', action: 'VIEW' },
      ops: { label: 'Transit Monitoring', action: 'VIEW' },
    },
  },
  delivered: {
    state: 'delivered',
    label: 'Consignment Delivered',
    description: 'Weighbridge slip and proof of delivery logged. 48-hour inspection countdown started.',
    whoActsNext: 'buyer',
    defaultSlaHours: 48,
    primaryAction: {
      buyer: { label: 'Inspect & Accept Quality', action: 'BUYER_ACCEPT' },
      supplier: { label: 'Awaiting Quality Inspection', action: 'VIEW' },
      ops: { label: 'Monitor 48h Inspection SLA', action: 'VIEW' },
    },
  },
  inspection: {
    state: 'inspection',
    label: 'Quality Inspection Window',
    description: 'Buyer is conducting moisture, purity, and weight QC. Auto-accepts after 48h.',
    whoActsNext: 'buyer',
    defaultSlaHours: 48,
    primaryAction: {
      buyer: { label: 'Accept Lot or Raise Dispute', action: 'BUYER_ACCEPT' },
      supplier: { label: 'Under Inspection', action: 'VIEW' },
      ops: { label: 'Inspection Workbench', action: 'VIEW' },
    },
  },
  accepted: {
    state: 'accepted',
    label: 'Consignment Accepted',
    description: 'Buyer approved quality. Releasing bank escrow and realizing platform fee.',
    whoActsNext: 'ops',
    defaultSlaHours: 6,
    primaryAction: {
      buyer: { label: 'Deal Completed', action: 'VIEW' },
      supplier: { label: 'Escrow Releasing', action: 'VIEW' },
      ops: { label: 'Trigger Bank Release & Settle Fee', action: 'RELEASE_AND_SETTLE' },
    },
  },
  disputed: {
    state: 'disputed',
    label: 'Inspection Disputed',
    description: 'Buyer raised a quality or weight variance with lab evidence. Escalated to Ops Desk.',
    whoActsNext: 'ops',
    defaultSlaHours: 24,
    primaryAction: {
      ops: { label: 'Resolve Dispute in Ops Desk', action: 'OPS_RESOLVE_DISPUTE' },
      buyer: { label: 'Dispute Under Review', action: 'VIEW' },
      supplier: { label: 'Dispute Response Pending', action: 'VIEW' },
    },
  },
  resolved: {
    state: 'resolved',
    label: 'Dispute Resolved',
    description: 'Ops decision recorded (price adjustment, partial accept, or return).',
    whoActsNext: 'ops',
    primaryAction: {
      ops: { label: 'Release Adjusted Escrow', action: 'RESERVE_RELEASED' },
      buyer: { label: 'Review Resolution Notice', action: 'VIEW' },
      supplier: { label: 'Review Resolution Notice', action: 'VIEW' },
    },
  },
  reserve_released: {
    state: 'reserve_released',
    label: 'Escrow Released',
    description: 'Bank partner released reserved deposit. Settling platform commission invoice.',
    whoActsNext: 'ops',
    primaryAction: {
      ops: { label: 'Record Fee Settlement', action: 'SETTLE_FEE' },
      buyer: { label: 'Reserve Settled', action: 'VIEW' },
      supplier: { label: 'Payout Processing', action: 'VIEW' },
    },
  },
  fee_settled: {
    state: 'fee_settled',
    label: 'Platform Fee Settled',
    description: 'Double-entry ledger entry stamped. Moving deal to closed.',
    whoActsNext: 'none',
    primaryAction: {
      ops: { label: 'Close Deal', action: 'CLOSE' },
      buyer: { label: 'Finished', action: 'VIEW' },
      supplier: { label: 'Finished', action: 'VIEW' },
    },
  },
  closed: {
    state: 'closed',
    label: 'Completed & Closed',
    description: 'Deal successfully executed, audited, and archived in the immutable ledger.',
    whoActsNext: 'none',
    primaryAction: {
      buyer: { label: 'Rebook Similar Order', action: 'REBOOK' },
      supplier: { label: 'View Settlement Slip', action: 'VIEW' },
      ops: { label: 'Archived in Audit Log', action: 'VIEW' },
    },
  },
  lapsed: {
    state: 'lapsed',
    label: 'Lapsed (Timeout)',
    description: 'Deal expired because confirmation, terms acceptance, or reserve timed out.',
    whoActsNext: 'none',
    primaryAction: {
      buyer: { label: 'Search New Listings', action: 'SEARCH' },
      supplier: { label: 'Relist Stock', action: 'RELIST' },
      ops: { label: 'Audit Lapse Event', action: 'VIEW' },
    },
  },
  withdrawn: {
    state: 'withdrawn',
    label: 'Supplier Withdrawn',
    description: 'Supplier cancelled after price lock commitment. Scorecard penalty applied.',
    whoActsNext: 'none',
    primaryAction: {
      buyer: { label: 'Auto-Refund Initiated', action: 'REFUND' },
      supplier: { label: 'Scorecard Penalty Recorded', action: 'VIEW' },
      ops: { label: 'Review Supplier Scorecard', action: 'VIEW' },
    },
  },
  cancelled: {
    state: 'cancelled',
    label: 'Cancelled',
    description: 'Deal cancelled prior to bank reserve deposit.',
    whoActsNext: 'none',
    primaryAction: {
      buyer: { label: 'Order Cancelled', action: 'VIEW' },
      supplier: { label: 'Order Cancelled', action: 'VIEW' },
      ops: { label: 'View Cancellation Audit', action: 'VIEW' },
    },
  },
};

/**
 * XState v5 Machine Definition for Deal Transitions (Section 8 & 17.3)
 */
export const dealXStateMachine = setup({
  types: {
    context: {} as {
      dealId: string;
      version: number;
      lockExpiresAt: string;
      buyerId: string;
      supplierId: string;
    },
    events: {} as
      | { type: 'SUPPLIER_CONFIRM' }
      | { type: 'BUYER_ACCEPT_TERMS' }
      | { type: 'RESERVE_INITIATED' }
      | { type: 'RESERVE_CONFIRMED' }
      | { type: 'MARK_DISPATCHED' }
      | { type: 'RECORD_DELIVERY' }
      | { type: 'BUYER_ACCEPT' }
      | { type: 'BUYER_DISPUTE'; evidenceUrls: string[] }
      | { type: 'OPS_RESOLVE_DISPUTE'; resolution: string }
      | { type: 'RESERVE_RELEASED' }
      | { type: 'SETTLE_FEE' }
      | { type: 'EXPIRE_TIMEOUT' }
      | { type: 'SUPPLIER_REJECT' }
      | { type: 'CANCEL' },
  },
}).createMachine({
  id: 'dealStateMachine',
  initial: 'matched',
  context: {
    dealId: '',
    version: 1,
    lockExpiresAt: '',
    buyerId: '',
    supplierId: '',
  },
  states: {
    matched: {
      on: {
        SUPPLIER_CONFIRM: 'supplier_confirmed',
        SUPPLIER_REJECT: 'withdrawn',
        EXPIRE_TIMEOUT: 'lapsed',
        CANCEL: 'cancelled',
      },
    },
    supplier_confirmed: {
      on: {
        BUYER_ACCEPT_TERMS: 'terms_accepted',
        EXPIRE_TIMEOUT: 'lapsed',
        CANCEL: 'cancelled',
      },
    },
    terms_accepted: {
      on: {
        RESERVE_INITIATED: 'reserve_pending',
        EXPIRE_TIMEOUT: 'lapsed',
        CANCEL: 'cancelled',
      },
    },
    reserve_pending: {
      on: {
        RESERVE_CONFIRMED: 'reserve_confirmed',
        EXPIRE_TIMEOUT: 'lapsed',
      },
    },
    reserve_confirmed: {
      on: {
        MARK_DISPATCHED: 'in_fulfilment',
        SUPPLIER_REJECT: 'withdrawn',
      },
    },
    in_fulfilment: {
      on: {
        RECORD_DELIVERY: 'delivered',
      },
    },
    delivered: {
      on: {
        EXPIRE_TIMEOUT: 'inspection',
        BUYER_ACCEPT: 'accepted',
        BUYER_DISPUTE: 'disputed',
      },
    },
    inspection: {
      on: {
        BUYER_ACCEPT: 'accepted',
        BUYER_DISPUTE: 'disputed',
        EXPIRE_TIMEOUT: 'accepted',
      },
    },
    accepted: {
      on: {
        RESERVE_RELEASED: 'reserve_released',
      },
    },
    disputed: {
      on: {
        OPS_RESOLVE_DISPUTE: 'resolved',
      },
    },
    resolved: {
      on: {
        RESERVE_RELEASED: 'reserve_released',
        CANCEL: 'closed',
      },
    },
    reserve_released: {
      on: {
        SETTLE_FEE: 'fee_settled',
      },
    },
    fee_settled: {
      on: {
        EXPIRE_TIMEOUT: 'closed',
      },
    },
    closed: { type: 'final' },
    lapsed: { type: 'final' },
    withdrawn: { type: 'final' },
    cancelled: { type: 'final' },
  },
});

import React, { useState } from 'react';
import { Deal, DealState, formatINR, UserRole } from '@bulkkx/shared';
import {
  ShieldAlert,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  FileText,
  UserCheck,
  Building,
  Phone,
  MapPin,
  Lock,
} from 'lucide-react';

interface DealTrackerProps {
  deal: Deal & { supplier?: any; buyer?: any; isIdentityRevealed?: boolean };
  currentRole: UserRole;
  onTriggerEvent: (event: string, payload?: any) => Promise<void>;
}

const STEPS: { state: DealState; label: string; description: string }[] = [
  { state: 'matched', label: 'Match Created', description: 'Buyer selected listing' },
  { state: 'supplier_confirmed', label: 'Supplier Confirmed', description: 'Stock & lock validated' },
  { state: 'terms_accepted', label: 'Terms Accepted', description: 'Legal contract locked' },
  { state: 'reserve_confirmed', label: 'Reserve Placed', description: '10% in Bank Escrow' },
  { state: 'in_fulfilment', label: 'Dispatched', description: 'Truck in transit' },
  { state: 'delivered', label: 'Delivered', description: 'Weighbridge PoD uploaded' },
  { state: 'inspection', label: '48h Inspection', description: 'Quality verification' },
  { state: 'accepted', label: 'Accepted', description: 'Goods confirmed' },
  { state: 'closed', label: 'Settled & Closed', description: 'Reserve & fee cleared' },
];

export const DealTracker: React.FC<DealTrackerProps> = ({ deal, currentRole, onTriggerEvent }) => {
  const [loading, setLoading] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const getStepStatus = (stepState: DealState) => {
    const stateOrder = [
      'matched',
      'supplier_confirmed',
      'terms_accepted',
      'reserve_pending',
      'reserve_confirmed',
      'in_fulfilment',
      'delivered',
      'inspection',
      'accepted',
      'reserve_released',
      'fee_settled',
      'closed',
    ];

    const currentIndex = stateOrder.indexOf(deal.state);
    const stepIndex = stateOrder.indexOf(stepState);

    if (deal.state === 'disputed' && stepState === 'inspection') return 'disputed';
    if (deal.state === 'withdrawn' || deal.state === 'cancelled') return 'failed';

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const handleAction = async (event: string, payload: any = {}) => {
    setLoading(true);
    try {
      await onTriggerEvent(event, { ...payload, expectedVersion: deal.version });
    } finally {
      setLoading(false);
    }
  };

  // Plain-English "Who Acts Next" Directive
  const getActionDirective = () => {
    switch (deal.state) {
      case 'matched':
        return {
          actor: 'Supplier',
          urgency: 'high',
          text: 'Waiting for Supplier to re-confirm stock and valid price lock.',
          allowedRole: 'supplier',
          actionEvent: 'SUPPLIER_CONFIRM',
          actionLabel: 'Confirm Stock & Lock Price',
        };
      case 'supplier_confirmed':
        return {
          actor: 'Buyer',
          urgency: 'high',
          text: 'Supplier confirmed stock! Review terms and initiate bank reserve.',
          allowedRole: 'buyer',
          actionEvent: 'BUYER_ACCEPT_TERMS',
          actionLabel: 'Accept Legal Terms & Proceed to Reserve',
        };
      case 'terms_accepted':
      case 'reserve_pending':
        return {
          actor: 'Bank / Reserve Partner',
          urgency: 'medium',
          text: 'Awaiting Bank/NBFC confirmation webhook for the 10% reserve deposit.',
          allowedRole: 'ops',
          actionEvent: 'TRIGGER_PARTNER_WEBHOOK',
          actionLabel: 'Simulate Partner Reserve Webhook Confirmed',
        };
      case 'reserve_confirmed':
        return {
          actor: 'Supplier',
          urgency: 'high',
          text: 'Reserve confirmed in Escrow! Supplier can now dispatch the consignment.',
          allowedRole: 'supplier',
          actionEvent: 'MARK_DISPATCHED',
          actionLabel: 'Confirm Consignment Dispatch',
        };
      case 'in_fulfilment':
        return {
          actor: 'Logistics / Supplier',
          urgency: 'medium',
          text: 'Consignment in transit. Awaiting Proof of Delivery (PoD) and weighbridge slip.',
          allowedRole: 'supplier',
          actionEvent: 'RECORD_DELIVERY',
          actionLabel: 'Upload Proof of Delivery & Arrive',
        };
      case 'delivered':
      case 'inspection':
        return {
          actor: 'Buyer',
          urgency: 'high',
          text: 'Delivery arrived! 48-Hour QC Inspection window active. Verify grade & moisture.',
          allowedRole: 'buyer',
          actionEvent: 'BUYER_ACCEPT',
          actionLabel: 'Accept & Approve Quality',
          secondaryAction: 'BUYER_DISPUTE',
        };
      case 'disputed':
        return {
          actor: 'BulkkX Ops Concierge',
          urgency: 'high',
          text: 'Buyer raised a quality dispute. Ops reviewing weighbridge and lab test evidence.',
          allowedRole: 'ops',
          actionEvent: 'OPS_RESOLVE_DISPUTE',
          actionLabel: 'Resolve Dispute (BulkkX Ops Concierge)',
        };
      case 'accepted':
      case 'resolved':
        return {
          actor: 'BulkkX Finance',
          urgency: 'medium',
          text: 'Deal accepted! Triggering bank reserve release to supplier.',
          allowedRole: 'ops',
          actionEvent: 'RESERVE_RELEASED',
          actionLabel: 'Release Bank Reserve',
        };
      case 'reserve_released':
        return {
          actor: 'BulkkX Finance',
          urgency: 'low',
          text: 'Reserve released. Settling platform fee invoice.',
          allowedRole: 'ops',
          actionEvent: 'SETTLE_FEE',
          actionLabel: 'Settle Platform Fee & Close Deal',
        };
      case 'closed':
        return {
          actor: 'System',
          urgency: 'done',
          text: 'Deal successfully completed and closed! Platform fee realized.',
          allowedRole: 'none',
        };
      default:
        return {
          actor: 'System',
          urgency: 'neutral',
          text: `Current state: ${deal.state}`,
          allowedRole: 'none',
        };
    }
  };

  const directive = getActionDirective();

  return (
    <div className="space-y-6">
      {/* 1. Header with Deal ID & Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {deal.dealCode}
              </span>
              <span className="text-xs text-slate-400 font-mono">v{deal.version} (Optimistic Concurrency)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              {deal.quantity} {deal.unit} Commodity Contract
            </h2>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Total Contract Value</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {formatINR(deal.effectiveTotalPaise)}
            </div>
          </div>
        </div>

        {/* 2. Plain English "Who Acts Next" Banner */}
        <div className={`mt-5 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          directive.urgency === 'high'
            ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
            : directive.urgency === 'done'
            ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
            : 'bg-indigo-950/30 border-indigo-800/80 text-indigo-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-900/80 mt-0.5">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-80">
                Who Acts Next: <span className="underline">{directive.actor}</span>
              </div>
              <p className="text-sm font-medium mt-0.5">{directive.text}</p>
            </div>
          </div>

          {/* Action Trigger Button */}
          {directive.actionEvent && (
            <div className="flex items-center gap-2">
              <button
                disabled={loading}
                onClick={() => handleAction(directive.actionEvent!)}
                className="px-4 py-2.5 rounded-lg font-semibold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>{directive.actionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {directive.secondaryAction === 'BUYER_DISPUTE' && (
                <button
                  disabled={loading}
                  onClick={() => setShowDisputeModal(true)}
                  className="px-3 py-2.5 rounded-lg font-semibold text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Raise Dispute</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. Anti-Disintermediation Masking Status Card */}
        <div className="mt-5 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Counterparty Identity Security & Confidentiality</span>
            </h4>
            {deal.isIdentityRevealed ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Identity Verified & Legally Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-semibold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800">
                <Lock className="w-3.5 h-3.5" /> Identity Strictly Masked (Pre-Reserve)
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Supplier Side View */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <div className="text-xs text-slate-500 font-medium">Supplier Profile</div>
              {deal.isIdentityRevealed && deal.supplier?.legalName ? (
                <div className="mt-2 space-y-1">
                  <div className="font-bold text-slate-100 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-400" />
                    <span>{deal.supplier.legalName}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{deal.supplier.phone}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {deal.supplier.address?.line1}, {deal.supplier.address?.city}, {deal.supplier.address?.state}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-emerald-400">GSTIN: {deal.supplier.gstin}</div>
                </div>
              ) : (
                <div className="mt-2 space-y-1 text-slate-300">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{deal.supplier?.pseudonym || 'Verified Supplier #GJ-402'}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Location: {deal.supplier?.city || 'Rajkot'}, {deal.supplier?.state || 'Gujarat'}
                  </div>
                  <div className="text-[11px] text-amber-400/90 italic">
                    Legal company name, phone & GSTIN masked to buyer until 10% Bank Reserve is confirmed.
                  </div>
                </div>
              )}
            </div>

            {/* Buyer Side View */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <div className="text-xs text-slate-500 font-medium">Buyer Profile</div>
              {deal.isIdentityRevealed && deal.buyer?.legalName ? (
                <div className="mt-2 space-y-1">
                  <div className="font-bold text-slate-100 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-400" />
                    <span>{deal.buyer.legalName}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{deal.buyer.phone}</span>
                  </div>
                  <div className="text-xs font-mono text-emerald-400">GSTIN: {deal.buyer.gstin}</div>
                </div>
              ) : (
                <div className="mt-2 space-y-1 text-slate-300">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{deal.buyer?.pseudonym || 'Gold Tier Verified Buyer #DL-881'}</span>
                  </div>
                  <div className="text-xs text-slate-400">Destination: New Delhi, Delhi (110020)</div>
                  <div className="text-[11px] text-emerald-400/90">
                    KYC Verified · Full legal identity shared with supplier upon reserve placement.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Horizontal State Stepper */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Deal State Machine Progress
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {STEPS.map((step, idx) => {
              const status = getStepStatus(step.state);
              return (
                <div
                  key={step.state}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    status === 'completed'
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : status === 'current'
                      ? 'bg-amber-950/60 border-amber-600 text-amber-200 ring-2 ring-amber-500/40'
                      : status === 'disputed'
                      ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-mono opacity-60">Step {idx + 1}</div>
                  <div className="font-bold text-xs mt-0.5 truncate">{step.label}</div>
                  <div className="text-[10px] mt-0.5 leading-tight opacity-75">{step.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Raise Quality Dispute</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Inspection window active (48 hours). Please record the discrepancy (moisture %, foreign matter, damage).
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-300">Dispute Details & Evidence</label>
              <textarea
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g. Moisture measured at 13.5% vs contractual 11.2% on weighbridge lab slip."
                className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!disputeReason || loading}
                onClick={async () => {
                  await handleAction('BUYER_DISPUTE', {
                    disputeReason,
                    evidenceFileKeys: ['evidence/lab_test_report_01.pdf'],
                  });
                  setShowDisputeModal(false);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer disabled:opacity-50"
              >
                Submit Dispute to Ops
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

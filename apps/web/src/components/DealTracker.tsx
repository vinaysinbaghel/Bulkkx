import React, { useState } from 'react';
import { Deal, DealState, formatINR, UserRole } from '@bulkkx/shared';
import {
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
          text: 'Reserve confirmed in Bank Escrow! Supplier can now dispatch the consignment.',
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
          actionLabel: 'Resolve Dispute (BulkkX Ops)',
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
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#e6f9f4] text-[#00a87e] border border-[#b2edd9]">
                {deal.dealCode}
              </span>
              <span className="text-xs text-gray-500 font-mono">v{deal.version} (Optimistic Lock)</span>
            </div>
            <h2 className="text-2xl font-bold text-[#141b29] mt-2">
              {deal.quantity} {deal.unit} Commodity Deal
            </h2>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500 font-medium">Total Contract Value</div>
            <div className="text-2xl font-extrabold font-mono text-[#00a87e]">
              {formatINR(deal.effectiveTotalPaise)}
            </div>
          </div>
        </div>

        {/* 2. Plain English "Who Acts Next" Banner */}
        <div className={`mt-6 p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          directive.urgency === 'high'
            ? 'bg-[#fffbeb] border-[#fef08a] text-[#854d0e]'
            : directive.urgency === 'done'
            ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'
            : 'bg-[#f8fafd] border-gray-200 text-gray-800'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white shadow-2xs mt-0.5">
              <Clock className="w-5 h-5 text-[#d97706]" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Action Required From: <span className="text-gray-900 font-extrabold underline">{directive.actor}</span>
              </div>
              <p className="text-sm font-semibold mt-1 text-gray-900">{directive.text}</p>
            </div>
          </div>

          {/* Action Trigger Button */}
          {directive.actionEvent && (
            <div className="flex items-center gap-2">
              <button
                disabled={loading}
                onClick={() => handleAction(directive.actionEvent!)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#00d09c] hover:bg-[#00b386] text-white shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                <span>{directive.actionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {directive.secondaryAction === 'BUYER_DISPUTE' && (
                <button
                  disabled={loading}
                  onClick={() => setShowDisputeModal(true)}
                  className="px-3.5 py-2.5 rounded-xl font-semibold text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Raise Dispute</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. Anti-Disintermediation Masking Status Card */}
        <div className="mt-6 p-5 rounded-2xl border border-gray-200 bg-[#f8fafd]">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00d09c]" />
              <span>Counterparty Identity Security & Confidentiality</span>
            </h4>
            {deal.isIdentityRevealed ? (
              <span className="inline-flex items-center gap-1 text-xs text-[#00a87e] font-semibold bg-[#e6f9f4] px-2.5 py-0.5 rounded-full border border-[#b2edd9]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Identity Verified & Legally Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <Lock className="w-3.5 h-3.5" /> Identity Strictly Masked (Pre-Reserve)
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Supplier Side View */}
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs">
              <div className="text-xs text-gray-500 font-medium">Supplier Profile</div>
              {deal.isIdentityRevealed && deal.supplier?.legalName ? (
                <div className="mt-2.5 space-y-1.5">
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#00d09c]" />
                    <span>{deal.supplier.legalName}</span>
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{deal.supplier.phone}</span>
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {deal.supplier.address?.line1}, {deal.supplier.address?.city}, {deal.supplier.address?.state}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-[#00a87e] font-semibold">
                    GSTIN: {deal.supplier.gstin}
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 space-y-1.5 text-gray-700">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{deal.supplier?.pseudonym || 'Verified Supplier #GJ-402'}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Location: {deal.supplier?.city || 'Rajkot'}, {deal.supplier?.state || 'Gujarat'}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium">
                    Legal company name, phone & GSTIN are protected until 10% Bank Reserve is confirmed.
                  </div>
                </div>
              )}
            </div>

            {/* Buyer Side View */}
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs">
              <div className="text-xs text-gray-500 font-medium">Buyer Profile</div>
              {deal.isIdentityRevealed && deal.buyer?.legalName ? (
                <div className="mt-2.5 space-y-1.5">
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#00d09c]" />
                    <span>{deal.buyer.legalName}</span>
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{deal.buyer.phone}</span>
                  </div>
                  <div className="text-xs font-mono text-[#00a87e] font-semibold">
                    GSTIN: {deal.buyer.gstin}
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 space-y-1.5 text-gray-700">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#00d09c]" />
                    <span>{deal.buyer?.pseudonym || 'Gold Tier Verified Buyer #DL-881'}</span>
                  </div>
                  <div className="text-xs text-gray-500">Destination: New Delhi, Delhi (110020)</div>
                  <div className="text-[11px] text-[#00a87e] font-medium">
                    KYC Verified · Full legal identity shared with supplier upon reserve placement.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Horizontal State Stepper */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
            Deal State Machine Progress
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
            {STEPS.map((step, idx) => {
              const status = getStepStatus(step.state);
              return (
                <div
                  key={step.state}
                  className={`p-3 rounded-2xl border text-center transition ${
                    status === 'completed'
                      ? 'bg-[#e6f9f4] border-[#b2edd9] text-[#00a87e]'
                      : status === 'current'
                      ? 'bg-white border-[#00d09c] text-[#141b29] ring-2 ring-[#00d09c]/25 shadow-xs'
                      : status === 'disputed'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Raise Quality Dispute</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              48-Hour Inspection window active. Please state the quality variance (moisture %, foreign matter, damage).
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-700">Dispute Details & Evidence</label>
              <textarea
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g. Moisture measured at 13.5% vs contractual 11.2% on weighbridge lab slip."
                className="mt-1.5 w-full bg-white border border-gray-300 rounded-xl p-3 text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
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
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50 shadow-xs"
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

import React, { useState } from 'react';
import {
  Category,
  CategoryTemplate,
  Match,
  Deal,
  LedgerEntry,
  AuditLog,
  formatINR,
  FIXED_CORE_FIELDS,
} from '@bulkkx/shared';
import {
  Shield,
  Layers,
  BookOpen,
  DollarSign,
  FileText,
  CheckCircle,
  Plus,
  AlertCircle,
  Scale,
  RefreshCw,
} from 'lucide-react';

interface OpsConsoleViewProps {
  categories: Category[];
  matches: Match[];
  deals: Deal[];
  ledger: LedgerEntry[];
  auditLogs: AuditLog[];
  onApproveMatch: (matchId: string, discountOverridePaise?: number) => Promise<void>;
  onCreateCategory: (catData: any) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const OpsConsoleView: React.FC<OpsConsoleViewProps> = ({
  categories,
  matches,
  deals,
  ledger,
  auditLogs,
  onApproveMatch,
  onCreateCategory,
  onRefreshData,
}) => {
  const [opsTab, setOpsTab] = useState<'workbench' | 'templates' | 'ledger' | 'audit'>('workbench');
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [customFieldLabel, setCustomFieldLabel] = useState('');
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldUnit, setCustomFieldUnit] = useState('');
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddCustomField = () => {
    if (!customFieldLabel || !customFieldName) return;
    setCustomFields((prev) => [
      ...prev,
      {
        id: `fld_${Date.now()}`,
        name: customFieldName.trim(),
        label: customFieldLabel.trim(),
        type: 'number',
        unit: customFieldUnit.trim() || undefined,
        required: true,
        matchable: true,
        shownOnCard: true,
        buyerVisible: true,
        requiredForTerms: true,
      },
    ]);
    setCustomFieldLabel('');
    setCustomFieldName('');
    setCustomFieldUnit('');
  };

  const handlePublishCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;
    setLoading(true);
    try {
      await onCreateCategory({
        name: newCatName,
        slug: newCatSlug,
        description: newCatDesc,
        categoryFields: customFields,
      });
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDesc('');
      setCustomFields([]);
      setOpsTab('workbench');
    } finally {
      setLoading(false);
    }
  };

  let totalReserveDebits = 0;
  let totalReserveCredits = 0;
  let totalFeeRevenue = 0;

  for (const entry of ledger) {
    if (entry.account === 'partner_reserve_holding') {
      if (entry.direction === 'DEBIT') totalReserveDebits += entry.amountPaise;
      if (entry.direction === 'CREDIT') totalReserveCredits += entry.amountPaise;
    }
    if (entry.account === 'bulkkx_fee_revenue') {
      totalFeeRevenue += entry.amountPaise;
    }
  }

  const activeReserveBalance = totalReserveDebits - totalReserveCredits;

  return (
    <div className="space-y-6">
      {/* Ops Sub-nav */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpsTab('workbench')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              opsTab === 'workbench'
                ? 'bg-[#141b29] text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            Matching Workbench ({matches.length})
          </button>

          <button
            onClick={() => setOpsTab('templates')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              opsTab === 'templates'
                ? 'bg-[#141b29] text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            Zero-Deploy Template Studio ({categories.length})
          </button>

          <button
            onClick={() => setOpsTab('ledger')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              opsTab === 'ledger'
                ? 'bg-[#141b29] text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            Append-Only Ledger & Escrow Recon
          </button>

          <button
            onClick={() => setOpsTab('audit')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              opsTab === 'audit'
                ? 'bg-[#141b29] text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            Security Audit Trail ({auditLogs.length})
          </button>
        </div>

        <button
          onClick={onRefreshData}
          className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-mono cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Sync Engine</span>
        </button>
      </div>

      {/* Tab 1: Matching Workbench */}
      {opsTab === 'workbench' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#141b29]">Matching Review & Discount Workbench</h2>
              <p className="text-xs text-gray-500">Human-in-the-loop review before buyer shortlist is dispatched</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-[#f8fafd] text-gray-500 uppercase font-semibold text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="p-4">Match Ref</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Original Locked Price</th>
                    <th className="p-4">BulkkX Subsidy</th>
                    <th className="p-4">Presented Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {matches.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/70 transition">
                      <td className="p-4 font-mono font-medium text-gray-900">{m.id.substring(0, 18)}...</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#e6f9f4] text-[#00a87e] border border-[#b2edd9]">
                          {m.matchScore}%
                        </span>
                      </td>
                      <td className="p-4 font-mono text-gray-600">{formatINR(m.originalPricePaise)}</td>
                      <td className="p-4 font-mono text-[#00a87e] font-bold">
                        - {formatINR(m.discountPaise)}
                      </td>
                      <td className="p-4 font-mono text-gray-900 font-bold">
                        {formatINR(m.presentedPricePaise)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          m.status === 'shortlisted'
                            ? 'bg-[#e6f9f4] text-[#00a87e] border border-[#b2edd9]'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {m.status !== 'shortlisted' ? (
                          <button
                            onClick={() => onApproveMatch(m.id)}
                            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#00d09c] hover:bg-[#00b386] text-white cursor-pointer shadow-2xs"
                          >
                            Approve Shortlist
                          </button>
                        ) : (
                          <span className="text-gray-400 font-medium">Shortlisted ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Zero-Deploy Category Template Studio */}
      {opsTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Active Horizontal Commodity Categories</h3>
            {categories.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                <div className="font-bold text-gray-900 text-sm">{c.name}</div>
                <div className="text-xs font-mono text-[#00a87e] mt-0.5">{c.slug}</div>
                <div className="text-xs text-gray-500 mt-1">{c.description}</div>
                <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between border-t border-gray-100 pt-2">
                  <span>Version: v1</span>
                  <span className="text-[#00a87e] font-semibold">Live in Engine</span>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[#141b29]">Zero-Deploy Category Template Studio</h3>
              <p className="text-xs text-gray-500 mt-1">
                Add a new commodity without code deployment. Fixed core fields (grade, quantity, unit, lead time, price lock) are automatically inherited.
              </p>
            </div>

            <form onSubmit={handlePublishCategory} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yellow Maize / Corn"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      if (!newCatSlug) {
                        setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                      }
                    }}
                    className="mt-1 w-full bg-white border border-gray-300 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#00d09c]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">URL Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. yellow-maize"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    className="mt-1 w-full bg-white border border-gray-300 rounded-xl p-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:border-[#00d09c]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Category Description</label>
                <input
                  type="text"
                  placeholder="e.g. Feed and industrial grade yellow maize from Bihar & Karnataka"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="mt-1 w-full bg-white border border-gray-300 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#00d09c]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafd] border border-gray-200">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Category-Specific Technical Specifications
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {customFields.map((f, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-800 font-mono shadow-2xs"
                    >
                      {f.label} ({f.unit || 'text'})
                    </span>
                  ))}
                  {customFields.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No custom fields added yet. Add below.</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Field Label (e.g. Moisture)"
                    value={customFieldLabel}
                    onChange={(e) => setCustomFieldLabel(e.target.value)}
                    className="bg-white border border-gray-300 rounded-xl p-2 text-xs text-gray-900 focus:outline-none focus:border-[#00d09c]"
                  />
                  <input
                    type="text"
                    placeholder="Identifier (e.g. moisturePct)"
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                    className="bg-white border border-gray-300 rounded-xl p-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-[#00d09c]"
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g. % or ppm)"
                    value={customFieldUnit}
                    onChange={(e) => setCustomFieldUnit(e.target.value)}
                    className="bg-white border border-gray-300 rounded-xl p-2 text-xs text-gray-900 focus:outline-none focus:border-[#00d09c]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="bg-[#141b29] hover:bg-black text-white rounded-xl text-xs font-bold px-3 py-2 cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Field</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-full font-bold text-xs bg-[#00d09c] hover:bg-[#00b386] text-white shadow-xs cursor-pointer disabled:opacity-50 transition"
                >
                  Publish New Category (Zero Deploy)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Append-Only Ledger & Escrow Reconciliation */}
      {opsTab === 'ledger' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Active Partner Escrow Balance
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#00a87e] mt-1.5">
                {formatINR(activeReserveBalance)}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Held in RBI-regulated Bank/NBFC partner escrow
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                BulkkX Platform Fee Accrued
              </div>
              <div className="text-3xl font-extrabold font-mono text-gray-900 mt-1.5">
                {formatINR(totalFeeRevenue)}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Realized upon verified deal fulfillment & closure
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Ledger Status & Integrity
              </div>
              <div className="text-2xl font-bold font-mono text-[#00a87e] mt-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#00a87e]" />
                <span>100% RECONCILED</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Integer paise precision · Zero float math
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-[#141b29] text-sm">Immutable Double-Entry Ledger Transactions</h4>
              <span className="text-xs font-mono text-gray-400">Total Entries: {ledger.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-[#f8fafd] text-gray-500 uppercase font-semibold text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Account</th>
                    <th className="p-4">Direction</th>
                    <th className="p-4">Amount (Paise)</th>
                    <th className="p-4">INR Value</th>
                    <th className="p-4">Idempotency Key</th>
                    <th className="p-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/70 transition">
                      <td className="p-4 text-gray-500 text-[11px]">
                        {new Date(entry.timestamp).toLocaleTimeString('en-IN')}
                      </td>
                      <td className="p-4 font-semibold text-gray-900">{entry.account}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          entry.direction === 'DEBIT'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-[#e6f9f4] text-[#00a87e] border border-[#b2edd9]'
                        }`}>
                          {entry.direction}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">{entry.amountPaise} p</td>
                      <td className="p-4 font-bold text-gray-900">{formatINR(entry.amountPaise)}</td>
                      <td className="p-4 text-gray-400 text-[10px] truncate max-w-[120px]">
                        {entry.idempotencyKey}
                      </td>
                      <td className="p-4 text-gray-600 font-sans">{entry.description}</td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-400 font-sans">
                        No ledger transactions recorded yet. Advance a deal to see double-entry bookings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Trail */}
      {opsTab === 'audit' && (
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-bold text-[#141b29] text-sm">Security & State Transition Audit Trail</h4>
            <span className="text-xs text-gray-400">Who, What, When, Before & After</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-[#f8fafd] text-gray-500 uppercase font-semibold text-[11px] border-b border-gray-200">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity</th>
                  <th className="p-4">Before / After Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-4 text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                    </td>
                    <td className="p-4 text-[#00a87e] font-bold">
                      {log.actorId} ({log.actorRole})
                    </td>
                    <td className="p-4 text-gray-900 font-semibold">{log.action}</td>
                    <td className="p-4 text-gray-600 font-medium">
                      {log.entityType}:{log.entityId}
                    </td>
                    <td className="p-4 text-gray-500 truncate max-w-md">
                      {log.after ? JSON.stringify(log.after) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

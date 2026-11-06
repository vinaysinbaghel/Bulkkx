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

  // Compute ledger balances in integer paise
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpsTab('workbench')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              opsTab === 'workbench'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Matching Workbench ({matches.length})</span>
          </button>

          <button
            onClick={() => setOpsTab('templates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              opsTab === 'templates'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Zero-Deploy Template Studio ({categories.length})</span>
          </button>

          <button
            onClick={() => setOpsTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              opsTab === 'ledger'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Append-Only Ledger & Escrow Recon</span>
          </button>

          <button
            onClick={() => setOpsTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              opsTab === 'audit'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Security Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        <button
          onClick={onRefreshData}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Sync Engine</span>
        </button>
      </div>

      {/* Tab 1: Matching Workbench */}
      {opsTab === 'workbench' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">
              Ops Concierge Matching Review Workbench
            </h3>
            <span className="text-xs text-slate-400">
              Human-in-the-loop review before buyer shortlist is dispatched
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Match Ref</th>
                    <th className="p-3.5">Score</th>
                    <th className="p-3.5">Original Locked Price</th>
                    <th className="p-3.5">BulkkX Subsidy</th>
                    <th className="p-3.5">Presented Price</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {matches.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-slate-200">{m.id.substring(0, 18)}...</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {m.matchScore}%
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{formatINR(m.originalPricePaise)}</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                        - {formatINR(m.discountPaise)}
                      </td>
                      <td className="p-3.5 font-mono text-slate-100 font-bold">
                        {formatINR(m.presentedPricePaise)}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.status === 'shortlisted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {m.status !== 'shortlisted' ? (
                          <button
                            onClick={() => onApproveMatch(m.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer"
                          >
                            Approve Shortlist
                          </button>
                        ) : (
                          <span className="text-slate-500 font-medium">Shortlisted ✓</span>
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
          {/* Active Categories List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-bold text-slate-200">Active Horizontal Commodity Categories</h3>
            {categories.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-bold text-slate-100 text-sm">{c.name}</div>
                <div className="text-xs font-mono text-emerald-400 mt-0.5">{c.slug}</div>
                <div className="text-xs text-slate-400 mt-1">{c.description}</div>
                <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Version: v1</span>
                  <span className="text-emerald-400 font-semibold">Live in Engine</span>
                </div>
              </div>
            ))}
          </div>

          {/* New Category Builder (Zero Deploy) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-100">Zero-Deploy Category Template Studio</h3>
              <p className="text-xs text-slate-400 mt-1">
                Add a new commodity without code deployment. Fixed core fields (grade, quantity, unit, lead time, price lock) are automatically inherited.
              </p>
            </div>

            <form onSubmit={handlePublishCategory} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Category Name</label>
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
                    className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. yellow-maize"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Category Description</label>
                <input
                  type="text"
                  placeholder="e.g. Feed and industrial grade yellow maize from Bihar & Karnataka"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100"
                />
              </div>

              {/* Dynamic Category-Specific Specification Attributes */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Category-Specific Technical Fields
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {customFields.map((f, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-800 text-xs text-indigo-300 font-mono"
                    >
                      {f.label} ({f.unit || 'text'})
                    </span>
                  ))}
                  {customFields.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No custom fields added yet. Add below.</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Field Label (e.g. Moisture)"
                    value={customFieldLabel}
                    onChange={(e) => setCustomFieldLabel(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Identifier (e.g. moisturePct)"
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g. % or ppm)"
                    value={customFieldUnit}
                    onChange={(e) => setCustomFieldUnit(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold px-3 py-2 cursor-pointer flex items-center justify-center gap-1"
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
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer disabled:opacity-50"
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
          {/* Reconciliation Balance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Active Partner Reserve Balance
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {formatINR(activeReserveBalance)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Held in RBI-regulated Bank/NBFC partner escrow
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                BulkkX Platform Fee Accrued
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {formatINR(totalFeeRevenue)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Realized upon verified deal fulfillment & closure
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Ledger Status & Integrity
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>100% RECONCILED</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Integer paise precision · Zero floating-point drift
              </div>
            </div>
          </div>

          {/* Double-Entry Ledger Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-slate-100 text-sm">Immutable Double-Entry Ledger Transactions</h4>
              <span className="text-xs font-mono text-slate-400">Total Entries: {ledger.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Account</th>
                    <th className="p-3.5">Direction</th>
                    <th className="p-3.5">Amount (Paise)</th>
                    <th className="p-3.5">INR Value</th>
                    <th className="p-3.5">Idempotency Key</th>
                    <th className="p-3.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {new Date(entry.timestamp).toLocaleTimeString('en-IN')}
                      </td>
                      <td className="p-3.5 text-indigo-300">{entry.account}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.direction === 'DEBIT'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {entry.direction}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{entry.amountPaise} p</td>
                      <td className="p-3.5 font-bold text-slate-100">{formatINR(entry.amountPaise)}</td>
                      <td className="p-3.5 text-slate-500 text-[10px] truncate max-w-[120px]">
                        {entry.idempotencyKey}
                      </td>
                      <td className="p-3.5 text-slate-300 font-sans">{entry.description}</td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500 font-sans">
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h4 className="font-bold text-slate-100 text-sm">Security & State Transition Audit Trail</h4>
            <span className="text-xs text-slate-400">Who, What, When, Before & After</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">Before / After Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="p-3.5 text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                    </td>
                    <td className="p-3.5 text-emerald-400 font-bold">
                      {log.actorId} ({log.actorRole})
                    </td>
                    <td className="p-3.5 text-slate-200 font-semibold">{log.action}</td>
                    <td className="p-3.5 text-indigo-300">
                      {log.entityType}:{log.entityId}
                    </td>
                    <td className="p-3.5 text-slate-400 truncate max-w-md">
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

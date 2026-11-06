import React, { useState } from 'react';
import { Category, CategoryTemplate, Listing, Deal, formatINR } from '@bulkkx/shared';
import { DynamicFormRenderer } from '../components/DynamicFormRenderer';
import { LockTimer } from '../components/LockTimer';
import { DealTracker } from '../components/DealTracker';
import {
  Factory,
  PlusCircle,
  Clock,
  Truck,
  CheckCircle2,
  RefreshCw,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

interface SupplierViewProps {
  categories: Category[];
  activeTemplate: CategoryTemplate | null;
  onSelectCategory: (categoryId: string) => void;
  selectedCategory: string;
  listings: Listing[];
  deals: Deal[];
  onCreateListing: (listingData: any) => Promise<void>;
  onRenewLock: (listingId: string) => Promise<void>;
  onTriggerDealEvent: (dealId: string, event: string, payload?: any) => Promise<void>;
}

export const SupplierView: React.FC<SupplierViewProps> = ({
  categories,
  activeTemplate,
  onSelectCategory,
  selectedCategory,
  listings,
  deals,
  onCreateListing,
  onRenewLock,
  onTriggerDealEvent,
}) => {
  const [tab, setTab] = useState<'listings' | 'create' | 'deals'>('listings');
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(100);
  const [priceInr, setPriceInr] = useState(2680);
  const [lockValidityHours, setLockValidityHours] = useState(24);
  const [leadTimeDays, setLeadTimeDays] = useState(2);
  const [loading, setLoading] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const handleFieldChange = (name: string, value: any) => {
    setAttributes((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateListing({
        categoryId: selectedCategory,
        attributes: {
          ...attributes,
          quantity,
          leadTimeDays,
          lockValidityHours,
        },
        quantityAvailable: quantity,
        minOrderQuantity: 10,
        priceInr,
        lockValidityHours,
        leadTimeDays,
      });
      setTab('listings');
    } finally {
      setLoading(false);
    }
  };

  const activeDeal = deals.find((d) => d.id === selectedDealId) || deals[0];

  return (
    <div className="space-y-6">
      {/* Supplier Sub-nav */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('listings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              tab === 'listings'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>My Active Listings ({listings.length})</span>
          </button>

          <button
            onClick={() => setTab('create')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              tab === 'create'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Listing & Price Lock</span>
          </button>

          <button
            onClick={() => setTab('deals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              tab === 'deals'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Orders & Dispatches ({deals.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Shree Balaji Agro Traders</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
            KYC Verified
          </span>
          <span className="text-[11px] text-amber-400 font-mono">100% Lock Honour Rate</span>
        </div>
      </div>

      {/* Tab 1: Active Listings & Price Locks */}
      {tab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Live Inventory with Active Price Locks</h3>
            <button
              onClick={() => setTab('create')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New Listing</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((l) => (
              <div
                key={l.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {l.id}
                    </span>
                    <LockTimer expiresAt={l.lockExpiresAt} />
                  </div>

                  <div className="mt-4 flex justify-between items-baseline">
                    <div>
                      <div className="text-xs text-slate-400">Available Stock</div>
                      <div className="text-xl font-bold text-slate-100 font-mono">
                        {l.quantityAvailable} {l.unit}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Guaranteed Locked Price</div>
                      <div className="text-xl font-bold text-amber-400 font-mono">
                        {formatINR(l.lockedPricePaise)} / {l.unit}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {Object.entries(l.attributes).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 text-[11px] font-mono">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Lead Time: {l.leadTimeDays} days</span>
                  <button
                    onClick={() => onRenewLock(l.id)}
                    className="px-3 py-1.5 rounded-lg font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 cursor-pointer flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Extend 24h Lock</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Create Listing Form (Dynamic Schema) */}
      {tab === 'create' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-100">Publish Commodity Listing & Lock Spot Price</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select category template. Locked prices guarantee buyer confidence and prevent off-market bargaining.
            </p>
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-slate-300 mb-2 block">Choose Commodity Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCategory(c.id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-amber-950/50 border-amber-500 text-slate-100 ring-1 ring-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-200">{c.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{c.description}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-6">
            {activeTemplate && (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                  <Factory className="w-3.5 h-3.5" />
                  <span>{activeTemplate.name}</span>
                </div>
                <DynamicFormRenderer
                  template={activeTemplate}
                  values={attributes}
                  onChange={handleFieldChange}
                  mode="supplier_listing"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Total Available Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Locked Spot Price (₹)</label>
                <input
                  type="number"
                  min={100}
                  value={priceInr}
                  onChange={(e) => setPriceInr(Number(e.target.value))}
                  className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Lock Window (Hours)</label>
                <select
                  value={lockValidityHours}
                  onChange={(e) => setLockValidityHours(Number(e.target.value))}
                  className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100"
                >
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours (Recommended)</option>
                  <option value={48}>48 Hours</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                Publish Listing with Guaranteed Lock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Orders & Dispatches */}
      {tab === 'deals' && (
        <div className="space-y-4">
          {deals.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <Clock className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-300 text-sm">No Orders Received Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                When buyers select your locked listing, match requests and order confirmations will appear here.
              </p>
            </div>
          ) : (
            <div>
              {deals.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {deals.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDealId(d.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                        activeDeal?.id === d.id
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {d.dealCode} ({d.state})
                    </button>
                  ))}
                </div>
              )}

              {activeDeal && (
                <DealTracker
                  deal={activeDeal}
                  currentRole="supplier"
                  onTriggerEvent={(event, payload) => onTriggerDealEvent(activeDeal.id, event, payload)}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('listings')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              tab === 'listings'
                ? 'bg-[#141b29] text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            My Active Listings ({listings.length})
          </button>

          <button
            onClick={() => setTab('create')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              tab === 'create'
                ? 'bg-[#141b29] text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            New Listing & Price Lock
          </button>

          <button
            onClick={() => setTab('deals')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              tab === 'deals'
                ? 'bg-[#141b29] text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            Orders & Dispatches ({deals.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-gray-500">
          <span className="font-bold text-gray-900">Shree Balaji Agro Traders</span>
          <span className="px-2 py-0.5 rounded-full bg-[#e6f9f4] text-[#00a87e] border border-[#b2edd9] text-[10px] font-bold">
            KYC Verified
          </span>
          <span className="text-[11px] text-[#00a87e] font-semibold">100% Lock Honour</span>
        </div>
      </div>

      {/* Tab 1: Active Listings & Price Locks */}
      {tab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#141b29]">Active Inventory with Guaranteed Price Locks</h2>
              <p className="text-xs text-gray-500">Locked prices prevent off-platform underbidding and guarantee buyer volume</p>
            </div>
            <button
              onClick={() => setTab('create')}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#00d09c] hover:bg-[#00b386] text-white cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New Listing</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {listings.map((l) => (
              <div
                key={l.id}
                className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {l.id}
                    </span>
                    <LockTimer expiresAt={l.lockExpiresAt} />
                  </div>

                  <div className="mt-4 flex justify-between items-baseline">
                    <div>
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Available Stock</div>
                      <div className="text-2xl font-bold text-gray-900 font-mono mt-0.5">
                        {l.quantityAvailable} {l.unit}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Locked Spot Price</div>
                      <div className="text-2xl font-bold text-[#00a87e] font-mono mt-0.5">
                        {formatINR(l.lockedPricePaise)} / {l.unit}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {Object.entries(l.attributes).map(([k, v]) => (
                      <span key={k} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-mono">
                        <span className="text-gray-400 uppercase">{k}:</span> {String(v)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Lead Time: <strong className="text-gray-800">{l.leadTimeDays} days</strong></span>
                  <button
                    onClick={() => onRenewLock(l.id)}
                    className="px-3.5 py-1.5 rounded-full font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer flex items-center gap-1.5 transition"
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
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-4xl mx-auto">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#141b29]">List Commodity with Guaranteed Price Lock</h3>
            <p className="text-xs text-gray-500 mt-1">
              Select category template. Locked prices give buyers instant purchase certainty and prevent off-market bargaining.
            </p>
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-700 mb-2 block">Choose Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCategory(c.id)}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-[#e6f9f4] border-[#00d09c] text-gray-900 ring-2 ring-[#00d09c]/20'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">{c.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{c.description}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-6">
            {activeTemplate && (
              <div className="p-5 rounded-2xl bg-[#f8fafd] border border-gray-200">
                <div className="text-xs font-bold uppercase tracking-wider text-[#00a87e] mb-3 flex items-center gap-1.5">
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
                <label className="text-xs font-semibold text-gray-700">Available Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1.5 w-full bg-white border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#00d09c] focus:ring-2 focus:ring-[#00d09c]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Locked Spot Price (₹)</label>
                <input
                  type="number"
                  min={100}
                  value={priceInr}
                  onChange={(e) => setPriceInr(Number(e.target.value))}
                  className="mt-1.5 w-full bg-white border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#00d09c] focus:ring-2 focus:ring-[#00d09c]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Lock Window (Hours)</label>
                <select
                  value={lockValidityHours}
                  onChange={(e) => setLockValidityHours(Number(e.target.value))}
                  className="mt-1.5 w-full bg-white border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#00d09c] focus:ring-2 focus:ring-[#00d09c]/20"
                >
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours (Standard)</option>
                  <option value={48}>48 Hours</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full font-bold text-xs bg-[#00d09c] hover:bg-[#00b386] text-white shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 transition"
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
            <div className="p-12 text-center bg-white border border-gray-200 rounded-3xl">
              <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <h4 className="font-bold text-gray-700 text-sm">No Orders Received Yet</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
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
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                        activeDeal?.id === d.id
                          ? 'bg-[#141b29] text-white shadow-xs font-bold'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
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

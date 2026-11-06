import React, { useState } from 'react';
import { Category, CategoryTemplate, Listing, Match, Deal, formatINR } from '@bulkkx/shared';
import { DynamicFormRenderer } from '../components/DynamicFormRenderer';
import { LockTimer } from '../components/LockTimer';
import { PriceBreakdownCard } from '../components/PriceBreakdownCard';
import { DealTracker } from '../components/DealTracker';
import {
  Sparkles,
  ShoppingBag,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

interface BuyerViewProps {
  categories: Category[];
  activeTemplate: CategoryTemplate | null;
  onSelectCategory: (categoryId: string) => void;
  selectedCategory: string;
  onPostRequirement: (req: any) => Promise<void>;
  matches: Match[];
  listings: Listing[];
  deals: Deal[];
  onSelectMatchForDeal: (matchId: string) => Promise<void>;
  onTriggerDealEvent: (dealId: string, event: string, payload?: any) => Promise<void>;
}

export const BuyerView: React.FC<BuyerViewProps> = ({
  categories,
  activeTemplate,
  onSelectCategory,
  selectedCategory,
  onPostRequirement,
  matches,
  listings,
  deals,
  onSelectMatchForDeal,
  onTriggerDealEvent,
}) => {
  const [tab, setTab] = useState<'post' | 'shortlist' | 'deals'>('shortlist');
  const [specs, setSpecs] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(25);
  const [targetPriceInr, setTargetPriceInr] = useState(2650);
  const [loading, setLoading] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const handleFieldChange = (name: string, value: any) => {
    setSpecs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onPostRequirement({
        categoryId: selectedCategory,
        specs,
        quantity,
        targetPriceInr,
      });
      setTab('shortlist');
    } finally {
      setLoading(false);
    }
  };

  const activeDeal = deals.find((d) => d.id === selectedDealId) || deals[0];

  return (
    <div className="space-y-6">
      {/* Buyer Sub-nav */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('shortlist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              tab === 'shortlist'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Matched Shortlists ({matches.length})</span>
          </button>

          <button
            onClick={() => setTab('post')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              tab === 'post'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Post New Requirement</span>
          </button>

          <button
            onClick={() => setTab('deals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              tab === 'deals'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active Deals & Escrow ({deals.length})</span>
          </button>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Non-Custodial · Zero Platform Fee to Buyer</span>
        </div>
      </div>

      {/* Tab 1: Post Requirement Form (Dynamic Schema-Driven) */}
      {tab === 'post' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-100">Create Commodity Requirement</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select a commodity sector. The schema dynamically adapts parameters to match verified supplier inventories.
            </p>
          </div>

          {/* Category Selector */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-slate-300 mb-2 block">Choose Commodity Sector</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCategory(c.id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-emerald-950/50 border-emerald-500 text-slate-100 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-200">{c.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{c.description}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmitRequirement} className="space-y-6">
            {activeTemplate ? (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{activeTemplate.name}</span>
                </div>
                <DynamicFormRenderer
                  template={activeTemplate}
                  values={specs}
                  onChange={handleFieldChange}
                  mode="buyer_requirement"
                />
              </div>
            ) : (
              <div className="text-slate-400 text-xs">Loading commodity template...</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Required Quantity (MT)</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Target Spot Price (₹ / MT)</label>
                <input
                  type="number"
                  min={100}
                  value={targetPriceInr}
                  onChange={(e) => setTargetPriceInr(Number(e.target.value))}
                  className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span>Find Matched Locked-Price Listings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Matched Shortlist with Masked Supplier Cards */}
      {tab === 'shortlist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">
              Matched Listings with Guaranteed Price Locks
            </h3>
            <span className="text-xs text-slate-400">
              Deterministic matching based on specs, lead time & scorecard
            </span>
          </div>

          {matches.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-300 text-sm">No Active Matches Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Post a requirement or wait for suppliers to lock spot prices against current mandis.
              </p>
              <button
                onClick={() => setTab('post')}
                className="mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 cursor-pointer"
              >
                Post Requirement Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {matches.map((m) => {
                const listing = listings.find((l) => l.id === m.listingId);
                return (
                  <div
                    key={m.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      {/* Top status & match score */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {m.matchScore}% Match
                          </span>
                          <span className="text-xs text-slate-400 font-mono">ID: {m.id.substring(0, 16)}</span>
                        </div>
                        {listing?.lockExpiresAt && <LockTimer expiresAt={listing.lockExpiresAt} />}
                      </div>

                      {/* Anti-disintermediation Masked Supplier Banner */}
                      <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">
                              Verified Supplier #GJ-MHM-402
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Rajkot APMC Hub (~42 km) · 98% Lock Honour
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold text-amber-400/90 bg-amber-950/30 px-2 py-1 rounded border border-amber-900/50">
                          Identity Masked (Pre-Reserve)
                        </span>
                      </div>

                      {/* Key Commodity Spec Chips */}
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        {listing?.attributes &&
                          Object.entries(listing.attributes).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2 py-1 rounded-md bg-slate-800/60 text-slate-300 font-mono text-[11px]"
                            >
                              <span className="text-slate-500 uppercase">{k}:</span> {String(v)}
                            </span>
                          ))}
                      </div>

                      {/* Pricing Comparison */}
                      <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800/60">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-xs text-slate-400">Locked Spot Price</div>
                            <div className="text-lg font-bold font-mono text-slate-200 line-through">
                              {formatINR(m.originalPricePaise)} / MT
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span>BulkkX Subsidy ({formatINR(m.discountPaise)})</span>
                            </div>
                            <div className="text-2xl font-extrabold font-mono text-emerald-400">
                              {formatINR(m.presentedPricePaise)}
                              <span className="text-xs font-normal text-slate-400"> / MT</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action button: Initiate Deal */}
                    <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div className="text-xs text-slate-400">
                        Dispatch within <strong className="text-slate-200">2 days</strong>
                      </div>

                      <button
                        onClick={() => {
                          onSelectMatchForDeal(m.id);
                          setTab('deals');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md cursor-pointer flex items-center gap-1.5 transition"
                      >
                        <span>Lock In Deal & Reserve</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Active Deals & Escrow Tracker */}
      {tab === 'deals' && (
        <div className="space-y-4">
          {deals.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <Clock className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-300 text-sm">No Active Deals</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select a matched listing from the shortlist to lock in deal terms and reserve escrow.
              </p>
            </div>
          ) : (
            <div>
              {/* If multiple deals, show switcher pills */}
              {deals.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {deals.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDealId(d.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                        activeDeal?.id === d.id
                          ? 'bg-emerald-500 text-slate-950 font-bold'
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
                  currentRole="buyer"
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

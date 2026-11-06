import React, { useState } from 'react';
import { Category, CategoryTemplate, Listing, Match, Deal, formatINR, Language, TRANSLATIONS } from '@bulkkx/shared';
import { DynamicFormRenderer } from '../components/DynamicFormRenderer';
import { LockTimer } from '../components/LockTimer';
import { PriceBreakdownCard } from '../components/PriceBreakdownCard';
import { DealTracker } from '../components/DealTracker';
import { CompareModal } from '../components/CompareModal';
import {
  Sparkles,
  ShoppingBag,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  Columns3,
  Wheat,
  Flame,
  Boxes,
  ArrowUpRight,
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
  lang?: Language;
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
  lang = 'en',
}) => {
  const [tab, setTab] = useState<'explore' | 'post' | 'shortlist' | 'deals'>('explore');
  const [specs, setSpecs] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(25);
  const [targetPriceInr, setTargetPriceInr] = useState(2650);
  const [loading, setLoading] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const t = TRANSLATIONS[lang || 'en'];

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
    <div className="space-y-8">
      {/* Groww-style Hero Section */}
      <div className="text-center py-6 sm:py-10 max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f9f4] text-[#00a87e] border border-[#b2edd9] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>India-First Horizontal Commodity Portal · Non-Custodial Bank Escrow</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#141b29] tracking-tight">
          Trade commodities with guaranteed <span className="text-[#00d09c]">price locks</span>
        </h1>

        <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Direct matching for bulk buyers with verified APMC & industrial suppliers. Enjoy locked spot prices, full quality transparency, and zero platform fees for buyers.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setTab('post')}
            className="px-6 py-3 rounded-full font-bold text-sm bg-[#00d09c] hover:bg-[#00b386] text-white shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-2"
          >
            <span>Post New Requirement</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTab('shortlist')}
            className="px-6 py-3 rounded-full font-bold text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-2xs transition cursor-pointer"
          >
            <span>View Matched Shortlists ({matches.length})</span>
          </button>
        </div>
      </div>

      {/* Navigation Pills (Groww Segmented Style) */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('explore')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              tab === 'explore'
                ? 'bg-[#141b29] text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            Explore Sectors
          </button>

          <button
            onClick={() => setTab('shortlist')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              tab === 'shortlist'
                ? 'bg-[#141b29] text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            Matched Shortlists ({matches.length})
          </button>

          <button
            onClick={() => setTab('post')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              tab === 'post'
                ? 'bg-[#141b29] text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            Requirement Builder
          </button>

          <button
            onClick={() => setTab('deals')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              tab === 'deals'
                ? 'bg-[#141b29] text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            Active Deals & Escrow ({deals.length})
          </button>
        </div>

        {matches.length >= 2 && tab === 'shortlist' && (
          <button
            onClick={() => setShowCompareModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#e6f9f4] hover:bg-[#d0f5eb] text-[#00a87e] border border-[#b2edd9] cursor-pointer flex items-center gap-1.5 transition"
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Compare Top 3</span>
          </button>
        )}
      </div>

      {/* View 1: Explore Sectors Grid (Groww Product Cards Style) */}
      {tab === 'explore' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#141b29]">Horizontal Commodity Markets</h2>
              <p className="text-xs text-gray-500">Live mandis, spot price locks, and verified inventories</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {categories.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCategory(c.id);
                    setTab('post');
                  }}
                  className={`bg-white border rounded-2xl p-6 transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between ${
                    isSelected ? 'border-[#00d09c] ring-2 ring-[#00d09c]/20' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#e6f9f4] flex items-center justify-center text-[#00d09c] mb-4">
                      {c.id === 'cat-grains' ? (
                        <Wheat className="w-6 h-6" />
                      ) : c.id === 'cat-spices' ? (
                        <Flame className="w-6 h-6" />
                      ) : (
                        <Boxes className="w-6 h-6" />
                      )}
                    </div>

                    <h3 className="font-bold text-[#141b29] text-base">{c.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Spot Benchmark</div>
                      <div className="text-base font-bold font-mono text-gray-900 mt-0.5">
                        {c.id === 'cat-grains' ? '₹2,680 / MT' : c.id === 'cat-spices' ? '₹18,500 / Q' : '₹94.50 / KG'}
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 group-hover:text-[#00d09c]">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Post Requirement (Adaptive Schema-Driven) */}
      {tab === 'post' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-4xl mx-auto">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#141b29]">Post Commodity Requirement</h3>
            <p className="text-xs text-gray-500 mt-1">
              Select category. The form parameters dynamically adapt to the physical specs of the commodity.
            </p>
          </div>

          {/* Category Selector Pills */}
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

          <form onSubmit={handleSubmitRequirement} className="space-y-6">
            {activeTemplate ? (
              <div className="p-5 rounded-2xl bg-[#f8fafd] border border-gray-200">
                <div className="text-xs font-bold uppercase tracking-wider text-[#00a87e] mb-3 flex items-center gap-1.5">
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
              <div className="text-gray-400 text-xs">Loading template...</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">Required Quantity (MT)</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1.5 w-full bg-white border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#00d09c] focus:ring-2 focus:ring-[#00d09c]/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Target Spot Price (₹ / MT)</label>
                <input
                  type="number"
                  min={100}
                  value={targetPriceInr}
                  onChange={(e) => setTargetPriceInr(Number(e.target.value))}
                  className="mt-1.5 w-full bg-white border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#00d09c] focus:ring-2 focus:ring-[#00d09c]/20"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full font-bold text-xs bg-[#00d09c] hover:bg-[#00b386] text-white shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2 transition"
              >
                <span>Find Matched Locked-Price Listings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View 3: Matched Shortlists */}
      {tab === 'shortlist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#141b29]">Matched Listings with Price Locks</h2>
              <p className="text-xs text-gray-500">Deterministic algorithmic match based on grade specs & dispatch SLAs</p>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="p-12 text-center bg-white border border-gray-200 rounded-3xl">
              <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <h4 className="font-bold text-gray-700 text-sm">No Active Matches Found</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Post a requirement or wait for suppliers to lock spot prices against current mandis.
              </p>
              <button
                onClick={() => setTab('post')}
                className="mt-4 px-5 py-2 rounded-full text-xs font-bold bg-[#00d09c] text-white cursor-pointer shadow-xs"
              >
                Post Requirement
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {matches.map((m) => {
                const listing = listings.find((l) => l.id === m.listingId);
                return (
                  <div
                    key={m.id}
                    className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Match Score & Timer */}
                      <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e6f9f4] text-[#00a87e] border border-[#b2edd9]">
                            {m.matchScore}% Match
                          </span>
                          <span className="text-xs text-gray-400 font-mono">Lot #{m.id.substring(0, 14)}</span>
                        </div>
                        {listing?.lockExpiresAt && <LockTimer expiresAt={listing.lockExpiresAt} />}
                      </div>

                      {/* Anti-Disintermediation Masked Supplier Card */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-[#f8fafd] border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900">
                              Verified Supplier #GJ-MHM-402
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Rajkot APMC Hub (~42 km) · 98% Lock Honour
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          Identity Masked (Pre-Reserve)
                        </span>
                      </div>

                      {/* Commodity Specs Chips */}
                      <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
                        {listing?.attributes &&
                          Object.entries(listing.attributes).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-mono text-[11px]"
                            >
                              <span className="text-gray-400 uppercase">{k}:</span> {String(v)}
                            </span>
                          ))}
                      </div>

                      {/* Price Section */}
                      <div className="mt-5 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-xs text-gray-500">Locked Spot Price</div>
                            <div className="text-lg font-bold font-mono text-gray-400 line-through">
                              {formatINR(m.originalPricePaise)} / MT
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-[#00a87e] flex items-center gap-1 font-semibold">
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span>BulkkX Subsidy ({formatINR(m.discountPaise)})</span>
                            </div>
                            <div className="text-2xl font-extrabold font-mono text-gray-900">
                              {formatINR(m.presentedPricePaise)}
                              <span className="text-xs font-normal text-gray-500"> / MT</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Dispatch lead time: <strong className="text-gray-800">2 days</strong>
                      </div>

                      <button
                        onClick={() => {
                          onSelectMatchForDeal(m.id);
                          setTab('deals');
                        }}
                        className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#00d09c] hover:bg-[#00b386] text-white shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5 transition"
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

      {/* View 4: Active Deals & Escrow Tracker */}
      {tab === 'deals' && (
        <div className="space-y-4">
          {deals.length === 0 ? (
            <div className="p-12 text-center bg-white border border-gray-200 rounded-3xl">
              <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <h4 className="font-bold text-gray-700 text-sm">No Active Deals</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Select a matched listing from the shortlist to lock in deal terms and reserve escrow.
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
                  currentRole="buyer"
                  onTriggerEvent={(event, payload) => onTriggerDealEvent(activeDeal.id, event, payload)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <CompareModal
          matches={matches}
          listings={listings}
          onClose={() => setShowCompareModal(false)}
          onSelectMatch={(matchId) => {
            onSelectMatchForDeal(matchId);
            setTab('deals');
          }}
        />
      )}
    </div>
  );
};

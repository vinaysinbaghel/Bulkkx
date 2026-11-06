import React from 'react';
import { Match, Listing, formatINR } from '@bulkkx/shared';
import { X, Check, Award, TrendingDown } from 'lucide-react';
import { LockTimer } from './LockTimer';

interface CompareModalProps {
  matches: Match[];
  listings: Listing[];
  onClose: () => void;
  onSelectMatch: (matchId: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  matches,
  listings,
  onClose,
  onSelectMatch,
}) => {
  const compareItems = matches.slice(0, 3).map((m) => {
    const listing = listings.find((l) => l.id === m.listingId);
    return { match: m, listing };
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#e6f9f4] text-[#00a87e] border border-[#b2edd9]">
                Side-by-Side Analysis
              </span>
              <h3 className="text-xl font-bold text-[#141b29]">Compare Matched Commodity Listings</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Compare locked prices, BulkkX direct subsidies, technical specifications, and lead times across up to 3 suppliers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {compareItems.map(({ match, listing }, idx) => {
            const isBestValue = idx === 0;

            return (
              <div
                key={match.id}
                className={`p-6 rounded-2xl border flex flex-col justify-between transition ${
                  isBestValue
                    ? 'bg-white border-[#00d09c] ring-2 ring-[#00d09c]/20 shadow-sm'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-xs font-mono font-bold text-gray-500">
                      Option #{idx + 1}
                    </span>
                    {isBestValue && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00d09c] text-white flex items-center gap-1 shadow-2xs">
                        <Award className="w-3 h-3" /> Top Value Match
                      </span>
                    )}
                  </div>

                  {/* Price Comparison */}
                  <div className="mt-4 p-4 rounded-xl bg-[#f8fafd] border border-gray-200 text-center">
                    <div className="text-xs text-gray-500 font-medium">Presented Spot Price</div>
                    <div className="text-2xl font-extrabold font-mono text-gray-900 mt-0.5">
                      {formatINR(match.presentedPricePaise)}
                      <span className="text-xs font-normal text-gray-500"> / MT</span>
                    </div>
                    {match.discountPaise > 0 && (
                      <div className="text-[11px] text-[#00a87e] font-semibold mt-1 flex items-center justify-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        <span>Saved {formatINR(match.discountPaise)} via BulkkX</span>
                      </div>
                    )}
                    <div className="text-[11px] text-gray-400 line-through mt-0.5">
                      Base: {formatINR(match.originalPricePaise)}
                    </div>
                  </div>

                  {/* Price Lock Timer */}
                  <div className="mt-3.5 flex justify-center">
                    {listing?.lockExpiresAt && <LockTimer expiresAt={listing.lockExpiresAt} compact />}
                  </div>

                  {/* Specs List */}
                  <div className="mt-5 space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">Match Compatibility</span>
                      <span className="font-bold text-[#00a87e]">{match.matchScore}% Match</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">Dispatch Lead Time</span>
                      <span className="font-semibold text-gray-800">{listing?.leadTimeDays || 2} Days</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">Supplier Reliability</span>
                      <span className="font-semibold text-amber-700">98% Lock Honour</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">Identity Security</span>
                      <span className="text-[11px] font-mono text-gray-600">Masked Pre-Reserve</span>
                    </div>

                    {listing?.attributes &&
                      Object.entries(listing.attributes).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1.5 border-b border-gray-100">
                          <span className="text-gray-500 capitalize">{k}</span>
                          <span className="font-mono text-gray-800 font-medium">{String(v)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      onSelectMatch(match.id);
                      onClose();
                    }}
                    className={`w-full py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs ${
                      isBestValue
                        ? 'bg-[#00d09c] hover:bg-[#00b386] text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Select Option #{idx + 1}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

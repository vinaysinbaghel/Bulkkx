import React from 'react';
import { formatINR } from '@bulkkx/shared';
import { ShieldCheck, Info } from 'lucide-react';

interface PriceBreakdownCardProps {
  unitPricePaise: number;
  quantity: number;
  unit: string;
  discountPaise?: number;
  reservePercentage?: number;
}

export const PriceBreakdownCard: React.FC<PriceBreakdownCardProps> = ({
  unitPricePaise,
  quantity,
  unit,
  discountPaise = 0,
  reservePercentage = 10,
}) => {
  const totalGoodsValuePaise = unitPricePaise * quantity;
  const effectiveTotalPaise = Math.max(0, totalGoodsValuePaise - discountPaise);
  const reserveAmountPaise = Math.round(effectiveTotalPaise * (reservePercentage / 100));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h4 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
          <span>Commercial & Price Breakdown</span>
        </h4>
        <span className="text-xs bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full font-medium">
          Zero Platform Commission to Buyer
        </span>
      </div>

      <div className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>
            Locked Base Price ({quantity} {unit} × {formatINR(unitPricePaise)}/{unit})
          </span>
          <span className="font-mono text-slate-200">{formatINR(totalGoodsValuePaise)}</span>
        </div>

        {discountPaise > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span className="flex items-center gap-1">
              <span>BulkkX Subsidy / Volume Discount</span>
              <Info className="w-3.5 h-3.5 opacity-70" />
            </span>
            <span className="font-mono font-medium">- {formatINR(discountPaise)}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800/80 flex justify-between font-bold text-base text-slate-100">
          <span>Net Commercial Value</span>
          <span className="font-mono text-emerald-400">{formatINR(effectiveTotalPaise)}</span>
        </div>

        <div className="mt-3 p-3.5 rounded-lg bg-amber-950/20 border border-amber-900/40">
          <div className="flex justify-between items-center text-amber-300 font-semibold text-sm">
            <span>Required Reserve Deposit ({reservePercentage}%)</span>
            <span className="font-mono text-base">{formatINR(reserveAmountPaise)}</span>
          </div>
          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-400/80">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              <strong>Non-Custodial Escrow:</strong> Reserved with an RBI-regulated bank/NBFC partner. BulkkX does not hold buyer money. Released only upon verified delivery and buyer inspection.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

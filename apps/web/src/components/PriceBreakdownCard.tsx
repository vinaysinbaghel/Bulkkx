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
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
        <h4 className="font-bold text-[#141b29] text-sm">
          Commercial Breakdown
        </h4>
        <span className="text-xs bg-[#e6f9f4] text-[#00a87e] border border-[#b2edd9] px-2.5 py-0.5 rounded-full font-semibold">
          0% Platform Fee to Buyer
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>
            Locked Base Price ({quantity} {unit} × {formatINR(unitPricePaise)}/{unit})
          </span>
          <span className="font-mono text-gray-900 font-medium">{formatINR(totalGoodsValuePaise)}</span>
        </div>

        {discountPaise > 0 && (
          <div className="flex justify-between text-[#00a87e]">
            <span className="flex items-center gap-1 font-medium">
              <span>BulkkX Direct Subsidy</span>
              <Info className="w-3.5 h-3.5 opacity-70" />
            </span>
            <span className="font-mono font-bold">- {formatINR(discountPaise)}</span>
          </div>
        )}

        <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-base text-[#141b29]">
          <span>Net Commercial Value</span>
          <span className="font-mono text-[#00a87e]">{formatINR(effectiveTotalPaise)}</span>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-[#f8fafd] border border-gray-200">
          <div className="flex justify-between items-center text-gray-800 font-bold text-sm">
            <span>Required Reserve Deposit ({reservePercentage}%)</span>
            <span className="font-mono text-base text-[#00a87e]">{formatINR(reserveAmountPaise)}</span>
          </div>
          <div className="mt-2 flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#00d09c] mt-0.5" />
            <span>
              <strong>Non-Custodial Bank Escrow:</strong> Reserved directly with an RBI-regulated bank/NBFC partner. BulkkX does not hold buyer money. Released only upon verified delivery and buyer inspection acceptance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

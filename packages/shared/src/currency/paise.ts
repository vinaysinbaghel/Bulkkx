/**
 * BulkkX Financial Calculation Core
 * Strictly enforces integer paise (1 INR = 100 paise) to prevent floating-point drift.
 */

/**
 * Converts INR (e.g. 1500.50) to integer paise (150050)
 */
export function toPaise(inr: number): number {
  if (isNaN(inr)) return 0;
  return Math.round(inr * 100);
}

/**
 * Converts integer paise (150050) to INR (1500.50)
 */
export function toINR(paise: number): number {
  if (isNaN(paise)) return 0;
  return paise / 100;
}

/**
 * Formats integer paise into Indian Rupee locale string: e.g. "₹1,50,000" or "₹1,50,000.50"
 */
export function formatINR(paise: number, includeDecimals = false): string {
  if (isNaN(paise)) return '₹0';
  const inr = toINR(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(inr);
}

/**
 * Calculates deal financial breakdown in integer paise:
 * 1. totalGoodsValuePaise = unitPricePaise * quantity
 * 2. effectiveTotalPaise = totalGoodsValuePaise - discountPaise
 * 3. reserveAmountPaise = Math.round(effectiveTotalPaise * (reservePercentage / 100))
 * 4. platformFeePaise = Math.round(totalGoodsValuePaise * (feeBasisPoints / 10000))
 */
export function calculateDealBreakdown(params: {
  unitPricePaise: number;
  quantity: number;
  discountPaise?: number;
  reservePercentage?: number; // e.g. 10 for 10%
  feePercentage?: number;     // e.g. 2 for 2%
}) {
  const { unitPricePaise, quantity, discountPaise = 0, reservePercentage = 10, feePercentage = 2 } = params;
  
  const totalGoodsValuePaise = Math.round(unitPricePaise * quantity);
  const effectiveTotalPaise = Math.max(0, totalGoodsValuePaise - discountPaise);
  const reserveAmountPaise = Math.round(effectiveTotalPaise * (reservePercentage / 100));
  const platformFeePaise = Math.round(totalGoodsValuePaise * (feePercentage / 100));

  return {
    unitPricePaise,
    quantity,
    totalGoodsValuePaise,
    discountPaise,
    effectiveTotalPaise,
    reservePercentage,
    reserveAmountPaise,
    platformFeePaise,
  };
}

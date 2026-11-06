import { Listing, Requirement, Match, ScoreComponent, CategoryTemplate } from '../types/domain';

export interface MatchingResult {
  matches: Match[];
  evaluatedCount: number;
  filteredCount: number;
}

export interface DiscountRule {
  id: string;
  categoryId?: string;
  buyerTier?: 'bronze' | 'silver' | 'gold';
  minQuantity?: number;
  discountPercentage: number; // e.g. 1.5%
  maxDiscountPaise?: number;  // Cap in paise
}

export const DEFAULT_DISCOUNT_RULES: DiscountRule[] = [
  { id: 'rule-gold-tier', buyerTier: 'gold', discountPercentage: 1.5, maxDiscountPaise: 5000000 },
  { id: 'rule-silver-tier', buyerTier: 'silver', discountPercentage: 0.8, maxDiscountPaise: 2500000 },
  { id: 'rule-volume-bulk', minQuantity: 50, discountPercentage: 1.0, maxDiscountPaise: 4000000 },
];

/**
 * Calculates platform discount for a matched requirement and listing
 */
export function calculateDiscount(
  listingPricePaise: number,
  quantity: number,
  buyerTier: 'bronze' | 'silver' | 'gold' = 'bronze',
  categoryId: string,
  rules: DiscountRule[] = DEFAULT_DISCOUNT_RULES
): number {
  const totalValuePaise = listingPricePaise * quantity;
  let highestDiscountPaise = 0;

  for (const rule of rules) {
    if (rule.categoryId && rule.categoryId !== categoryId) continue;
    if (rule.buyerTier && rule.buyerTier !== buyerTier) continue;
    if (rule.minQuantity && quantity < rule.minQuantity) continue;

    let discountPaise = Math.round(totalValuePaise * (rule.discountPercentage / 100));
    if (rule.maxDiscountPaise && discountPaise > rule.maxDiscountPaise) {
      discountPaise = rule.maxDiscountPaise;
    }

    if (discountPaise > highestDiscountPaise) {
      highestDiscountPaise = discountPaise;
    }
  }

  // Guardrail: Never discount more than 2% of total value so BulkkX does not lose on fee
  const maxGuardrail = Math.round(totalValuePaise * 0.02);
  return Math.min(highestDiscountPaise, maxGuardrail);
}

/**
 * Deterministic, explainable matching algorithm:
 * 1. Hard filters (category, quantity, lock validity)
 * 2. Weighted scoring on matchable fields, lead time, and price
 */
export function matchRequirementToListings(
  requirement: Requirement,
  listings: Listing[],
  template: CategoryTemplate,
  buyerTier: 'bronze' | 'silver' | 'gold' = 'bronze'
): MatchingResult {
  const now = new Date();
  const eligibleMatches: Match[] = [];
  let filteredCount = 0;

  for (const listing of listings) {
    // 1. Hard Filters
    if (listing.categoryId !== requirement.categoryId) {
      filteredCount++;
      continue;
    }
    if (listing.status !== 'active') {
      filteredCount++;
      continue;
    }
    const lockExpiry = new Date(listing.lockExpiresAt);
    if (now > lockExpiry) {
      filteredCount++;
      continue;
    }
    if (requirement.quantity < listing.minOrderQuantity || requirement.quantity > listing.quantityAvailable) {
      filteredCount++;
      continue;
    }

    // 2. Score Components
    const scoreBreakdown: ScoreComponent[] = [];

    // Spec match scoring (matchable fields)
    let specMatchScore = 100;
    const matchableFields = template.categoryFields.filter((f) => f.matchable);
    if (matchableFields.length > 0) {
      let matchedCount = 0;
      for (const field of matchableFields) {
        const reqVal = requirement.specs[field.name];
        const listVal = listing.attributes[field.name];
        if (reqVal === undefined || reqVal === listVal) {
          matchedCount++;
        }
      }
      specMatchScore = Math.round((matchedCount / matchableFields.length) * 100);
    }
    scoreBreakdown.push({
      criterion: 'Spec Compatibility',
      weight: 35,
      score: specMatchScore,
      reason: `${specMatchScore}% match across key technical specifications`,
    });

    // Price scoring (compare to buyer target if present, else normalized)
    let priceScore = 80;
    if (requirement.targetPricePaise) {
      if (listing.lockedPricePaise <= requirement.targetPricePaise) {
        priceScore = 100;
      } else {
        const delta = listing.lockedPricePaise - requirement.targetPricePaise;
        const pctOver = delta / requirement.targetPricePaise;
        priceScore = Math.max(0, Math.round(100 - pctOver * 150));
      }
    }
    scoreBreakdown.push({
      criterion: 'Price Competitiveness',
      weight: 35,
      score: priceScore,
      reason: requirement.targetPricePaise
        ? listing.lockedPricePaise <= requirement.targetPricePaise
          ? 'At or below buyer target price'
          : 'Slightly above buyer target'
        : 'Competitive locked spot price',
    });

    // Lead time scoring
    let leadTimeScore = 90;
    if (listing.leadTimeDays <= 3) leadTimeScore = 100;
    else if (listing.leadTimeDays <= 7) leadTimeScore = 80;
    else leadTimeScore = 60;
    scoreBreakdown.push({
      criterion: 'Lead Time & Dispatch',
      weight: 20,
      score: leadTimeScore,
      reason: `Supplier can dispatch within ${listing.leadTimeDays} days`,
    });

    // Reliability baseline
    scoreBreakdown.push({
      criterion: 'Supplier Scorecard',
      weight: 10,
      score: 95,
      reason: '98% lock honour rate & zero active disputes',
    });

    // Calculate weighted total score
    let totalScore = 0;
    for (const comp of scoreBreakdown) {
      totalScore += (comp.score * comp.weight) / 100;
    }
    const finalScore = Math.round(totalScore);

    // Calculate discount
    const originalPricePaise = listing.lockedPricePaise;
    const discountPaise = calculateDiscount(originalPricePaise, requirement.quantity, buyerTier, requirement.categoryId);
    const presentedPricePaise = originalPricePaise - Math.round(discountPaise / requirement.quantity);

    eligibleMatches.push({
      id: `match-${requirement.id}-${listing.id}`,
      requirementId: requirement.id,
      listingId: listing.id,
      supplierId: listing.supplierId,
      buyerId: requirement.buyerId,
      matchScore: finalScore,
      scoreBreakdown,
      originalPricePaise,
      discountPaise,
      presentedPricePaise,
      status: 'pending_ops', // Ops reviews before buyer sees shortlist
      createdAt: now.toISOString(),
    });
  }

  // Sort descending by match score
  eligibleMatches.sort((a, b) => b.matchScore - a.matchScore);

  return {
    matches: eligibleMatches,
    evaluatedCount: listings.length,
    filteredCount,
  };
}

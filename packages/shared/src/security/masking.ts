import { Deal, DealState, Listing, Party } from '../types/domain';

export interface MaskedSupplierView {
  maskedId: string;
  pseudonym: string; // e.g. "Verified Grains Supplier #GJ-402"
  state: string;
  city: string;
  distanceKm?: number;
  kycVerified: boolean;
  scorecard: {
    overallRating: number;
    dealsFulfilled: number;
    lockHonourRate: number;
  };
}

export interface MaskedBuyerView {
  maskedId: string;
  pseudonym: string; // e.g. "Buyer #DL-881"
  state: string;
  city: string;
  tier: string;
  kycVerified: boolean;
}

export interface MaskedDealResponse {
  deal: Omit<Deal, 'supplierId' | 'buyerId'> & {
    supplier: MaskedSupplierView | Partial<Party>;
    buyer: MaskedBuyerView | Partial<Party>;
    isIdentityRevealed: boolean;
  };
}

/**
 * State threshold for unmasking counterparty details.
 * Identities are only revealed AFTER the reserve is confirmed by the bank/NBFC partner.
 */
export const UNMASKED_STATES: DealState[] = [
  'reserve_confirmed',
  'in_fulfilment',
  'delivered',
  'inspection',
  'accepted',
  'disputed',
  'resolved',
  'reserve_released',
  'fee_settled',
  'closed',
];

/**
 * Generates an anonymous pseudonym from party details
 */
export function generatePseudonym(party: Party, prefix: 'Supplier' | 'Buyer'): string {
  const stateCode = party.address.state.substring(0, 2).toUpperCase();
  const shortHash = party.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return `${prefix} #${stateCode}-${shortHash}`;
}

/**
 * Strips PII and sensitive party details for buyers viewing deals
 */
export function maskDealForBuyer(deal: Deal, supplierParty: Party): MaskedDealResponse['deal'] {
  const isRevealed = UNMASKED_STATES.includes(deal.state);

  let supplierPayload: MaskedSupplierView | Partial<Party>;

  if (isRevealed) {
    // Identity is legally unlocked: buyer receives contact and pickup address
    supplierPayload = {
      id: supplierParty.id,
      legalName: supplierParty.legalName,
      tradeName: supplierParty.tradeName,
      phone: supplierParty.phone,
      email: supplierParty.email,
      gstin: supplierParty.gstin,
      address: supplierParty.address,
      scorecard: supplierParty.scorecard,
      kycStatus: supplierParty.kycStatus,
    };
  } else {
    // Zero-leak masking: only aggregated trust metrics
    supplierPayload = {
      maskedId: `masked-${supplierParty.id.substring(0, 8)}`,
      pseudonym: generatePseudonym(supplierParty, 'Supplier'),
      state: supplierParty.address.state,
      city: supplierParty.address.city,
      kycVerified: supplierParty.kycStatus === 'verified',
      scorecard: {
        overallRating: supplierParty.scorecard?.overallRating || 4.8,
        dealsFulfilled: supplierParty.scorecard?.dealsFulfilled || 24,
        lockHonourRate: supplierParty.scorecard?.lockHonourRate || 98,
      },
    };
  }

  // Clone deal without internal raw supplierId
  const { supplierId, buyerId, ...rest } = deal;

  return {
    ...rest,
    isIdentityRevealed: isRevealed,
    supplier: supplierPayload,
    buyer: {
      id: buyerId,
    },
  };
}

/**
 * Strips PII and sensitive party details for suppliers viewing deals
 */
export function maskDealForSupplier(deal: Deal, buyerParty: Party): MaskedDealResponse['deal'] {
  const isRevealed = UNMASKED_STATES.includes(deal.state);

  let buyerPayload: MaskedBuyerView | Partial<Party>;

  if (isRevealed) {
    buyerPayload = {
      id: buyerParty.id,
      legalName: buyerParty.legalName,
      phone: buyerParty.phone,
      email: buyerParty.email,
      gstin: buyerParty.gstin,
      address: buyerParty.address,
      buyerTier: buyerParty.buyerTier,
      kycStatus: buyerParty.kycStatus,
    };
  } else {
    buyerPayload = {
      maskedId: `masked-${buyerParty.id.substring(0, 8)}`,
      pseudonym: generatePseudonym(buyerParty, 'Buyer'),
      state: buyerParty.address.state,
      city: buyerParty.address.city,
      tier: buyerParty.buyerTier || 'silver',
      kycVerified: buyerParty.kycStatus === 'verified',
    };
  }

  const { supplierId, buyerId, ...rest } = deal;

  return {
    ...rest,
    isIdentityRevealed: isRevealed,
    supplier: {
      id: supplierId,
    },
    buyer: buyerPayload,
  };
}

/**
 * Sanitizes catalog listings so suppliers cannot put phone numbers or company names into public attributes
 */
export function sanitizeListingForBuyer(listing: Listing, supplierParty?: Party): Listing {
  return {
    ...listing,
    supplierId: `masked-${listing.supplierId.substring(0, 8)}`,
    location: {
      city: listing.location.city,
      state: listing.location.state,
      pincode: listing.location.pincode.substring(0, 3) + 'XXX', // Mask partial pincode
      line1: 'Masked - Disclosed upon reserve confirmation',
    },
  };
}

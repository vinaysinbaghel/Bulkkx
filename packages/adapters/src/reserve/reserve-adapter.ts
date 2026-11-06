import { Reserve, ReserveType, ReserveStatus } from '@bulkkx/shared';

export interface CreateReserveParams {
  dealId: string;
  dealCode: string;
  buyerId: string;
  amountPaise: number;
  reserveType: ReserveType; // 'cash' or 'credit'
  consentRecordId: string;
  metadata?: Record<string, any>;
}

export interface ReserveWebhookPayload {
  partnerEventId: string;
  partnerRef: string;
  dealId: string;
  status: ReserveStatus;
  amountPaise: number;
  timestamp: string;
  signature: string;
}

export interface IReservePartnerAdapter {
  createReserve(params: CreateReserveParams): Promise<Reserve>;
  getStatus(partnerRef: string): Promise<{ status: ReserveStatus; balancePaise: number }>;
  release(partnerRef: string, note?: string): Promise<{ success: boolean; releasedAmountPaise: number }>;
  refund(partnerRef: string, reason: string): Promise<{ success: boolean; refundedAmountPaise: number }>;
  verifyWebhookSignature(payload: string, signature: string, secretKey: string): boolean;
}

/**
 * Simulated Partner implementation (Bank Escrow or NBFC Credit Partner)
 * Supports testing with configurable delays and mock statuses.
 */
export class SimulatedReservePartnerAdapter implements IReservePartnerAdapter {
  private reserves = new Map<string, Reserve>();
  private secretKey: string;

  constructor(secretKey = 'mock_wh_secret_key_bulkkx_2026') {
    this.secretKey = secretKey;
  }

  async createReserve(params: CreateReserveParams): Promise<Reserve> {
    const partnerRef = `NBFC-RES-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const reserve: Reserve = {
      id: `res-${Date.now()}`,
      dealId: params.dealId,
      partnerRef,
      partnerName: 'RBI_REGULATED_PARTNER_SANDBOX',
      type: params.reserveType,
      amountPaise: params.amountPaise,
      status: 'confirmed', // Auto-confirmed in simulation
      consentRecordId: params.consentRecordId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.reserves.set(partnerRef, reserve);
    return reserve;
  }

  async getStatus(partnerRef: string): Promise<{ status: ReserveStatus; balancePaise: number }> {
    const res = this.reserves.get(partnerRef);
    if (!res) {
      return { status: 'failed', balancePaise: 0 };
    }
    return {
      status: res.status,
      balancePaise: res.status === 'confirmed' ? res.amountPaise : 0,
    };
  }

  async release(partnerRef: string, note?: string): Promise<{ success: boolean; releasedAmountPaise: number }> {
    const res = this.reserves.get(partnerRef);
    if (!res || res.status !== 'confirmed') {
      return { success: false, releasedAmountPaise: 0 };
    }
    res.status = 'released';
    res.updatedAt = new Date().toISOString();
    return { success: true, releasedAmountPaise: res.amountPaise };
  }

  async refund(partnerRef: string, reason: string): Promise<{ success: boolean; refundedAmountPaise: number }> {
    const res = this.reserves.get(partnerRef);
    if (!res || res.status !== 'confirmed') {
      return { success: false, refundedAmountPaise: 0 };
    }
    res.status = 'refunded';
    res.updatedAt = new Date().toISOString();
    return { success: true, refundedAmountPaise: res.amountPaise };
  }

  verifyWebhookSignature(payload: string, signature: string, secretKey = this.secretKey): boolean {
    // In production, HMAC-SHA256 signature verification is checked
    return signature.startsWith('mock_sig_') || signature.length > 8;
  }
}

export interface GstVerificationResult {
  valid: boolean;
  tradeName?: string;
  legalName?: string;
  stateCode?: string;
  status: 'active' | 'suspended' | 'cancelled' | 'not_found';
}

export interface BankVerificationResult {
  valid: boolean;
  registeredName?: string;
  ifscValid: boolean;
}

export interface IKycVerificationAdapter {
  verifyGst(gstin: string): Promise<GstVerificationResult>;
  verifyPan(pan: string): Promise<{ valid: boolean; nameOnPan?: string }>;
  verifyBankAccount(accountNumber: string, ifsc: string): Promise<BankVerificationResult>;
}

export class SimulatedKycVerificationAdapter implements IKycVerificationAdapter {
  async verifyGst(gstin: string): Promise<GstVerificationResult> {
    const cleanGst = gstin.trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(cleanGst)) {
      return { valid: false, status: 'not_found' };
    }
    return {
      valid: true,
      legalName: 'Simulated Commodity Trading Enterprise',
      tradeName: 'SCTE Logistics & Trading',
      stateCode: cleanGst.substring(0, 2),
      status: 'active',
    };
  }

  async verifyPan(pan: string): Promise<{ valid: boolean; nameOnPan?: string }> {
    const cleanPan = pan.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(cleanPan)) {
      return { valid: false };
    }
    return {
      valid: true,
      nameOnPan: 'VERIFIED TRADER PAN RECORD',
    };
  }

  async verifyBankAccount(accountNumber: string, ifsc: string): Promise<BankVerificationResult> {
    if (accountNumber.length < 8 || ifsc.length !== 11) {
      return { valid: false, ifscValid: false };
    }
    return {
      valid: true,
      registeredName: 'COMMODITY TRADER SETTLEMENT AC',
      ifscValid: true,
    };
  }
}

import { describe, it, expect } from 'vitest';
import {
  SimulatedReservePartnerAdapter,
  SimulatedKycVerificationAdapter,
  SimulatedNotificationAdapter,
  SimulatedFileStorageAdapter,
} from '../index';

describe('Simulated Adapters Suite', () => {
  it('Reserve Partner: creates reserve, checks status, and verifies webhook signature', async () => {
    const adapter = new SimulatedReservePartnerAdapter();

    const reserve = await adapter.createReserve({
      dealId: 'deal-test-1',
      dealCode: 'BX-2026-001',
      buyerId: 'buy-001',
      amountPaise: 500000,
      reserveType: 'cash',
      consentRecordId: 'consent-123',
    });

    expect(reserve.status).toBe('confirmed');
    expect(reserve.partnerRef).toContain('NBFC-RES-');

    const status = await adapter.getStatus(reserve.partnerRef);
    expect(status.status).toBe('confirmed');
    expect(status.balancePaise).toBe(500000);

    const isValid = adapter.verifyWebhookSignature('payload', 'mock_sig_partner_test');
    expect(isValid).toBe(true);

    const release = await adapter.release(reserve.partnerRef);
    expect(release.success).toBe(true);
    expect(release.releasedAmountPaise).toBe(500000);
  });

  it('KYC Verification: validates GSTIN format and returns active enterprise details', async () => {
    const kyc = new SimulatedKycVerificationAdapter();

    // Valid GSTIN: 24AAACB9021F1ZX
    const validResult = await kyc.verifyGst('24AAACB9021F1ZX');
    expect(validResult.valid).toBe(true);
    expect(validResult.status).toBe('active');
    expect(validResult.stateCode).toBe('24');

    // Invalid GSTIN
    const invalidResult = await kyc.verifyGst('INVALID_GST');
    expect(invalidResult.valid).toBe(false);
  });

  it('Notification Adapter: generates WhatsApp template record with deep link', async () => {
    const notifications = new SimulatedNotificationAdapter('https://portal.bulkkx.in');

    const record = await notifications.sendWhatsApp({
      toPhone: '+919876543210',
      templateName: 'deal_status_updated',
      params: { dealCode: 'BX-2026-9042', status: 'reserve_confirmed' },
      deepLinkPath: '/deals/deal-1',
    });

    expect(record.status).toBe('sent');
    expect(record.deepLink).toBe('https://portal.bulkkx.in/deals/deal-1');
  });

  it('Storage Adapter: generates short-lived presigned upload and download URLs', async () => {
    const storage = new SimulatedFileStorageAdapter();

    const upload = await storage.generatePresignedUploadUrl('kyc/pan.pdf', 'application/pdf', 900);
    expect(upload.uploadUrl).toContain('/upload/kyc/pan.pdf');
    expect(upload.uploadUrl).toContain('expires=900');

    const download = await storage.generatePresignedDownloadUrl('kyc/pan.pdf', 900);
    expect(download).toContain('/download/kyc/pan.pdf');
  });
});

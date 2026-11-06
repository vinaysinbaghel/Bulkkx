import { Router, Request, Response } from 'express';
import { store } from '../store/memory-store';
import { Party } from '@bulkkx/shared';

export const authRouter = Router();

// Store active OTPs in memory for testing
const activeOtps = new Map<string, string>();

/**
 * Request Phone OTP for Buyer or Supplier
 */
authRouter.post('/otp/request', (req: Request, res: Response) => {
  const { phone, role = 'buyer' } = req.body;
  if (!phone) {
    res.status(400).json({ error: 'Phone number is required' });
    return;
  }

  // Simulated OTP: 123456
  const otp = '123456';
  activeOtps.set(phone, otp);

  res.json({
    success: true,
    message: `OTP sent successfully to ${phone}. (POC Sandbox code: 123456)`,
    expiresInSeconds: 300,
  });
});

/**
 * Verify OTP & return user profile
 */
authRouter.post('/otp/verify', (req: Request, res: Response) => {
  const { phone, otp, role = 'buyer', legalName } = req.body;
  const expectedOtp = activeOtps.get(phone) || '123456';

  if (otp !== expectedOtp) {
    res.status(400).json({ error: 'Invalid or expired OTP' });
    return;
  }

  // Find or create party
  let existingParty = Array.from(store.parties.values()).find((p) => p.phone === phone);

  if (!existingParty) {
    const id = `${role.substring(0, 3)}-${Date.now()}`;
    existingParty = {
      id,
      userId: `usr-${id}`,
      legalName: legalName || (role === 'supplier' ? 'New Supplier Trader' : 'New Commodity Buyer'),
      role,
      entityType: 'proprietorship',
      phone,
      email: `${phone.replace(/\D/g, '')}@trader.bulkkx.in`,
      kycStatus: 'pending',
      kycDocuments: [],
      address: {
        line1: 'Mandi Gate No. 2',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
      },
      buyerTier: role === 'buyer' ? 'bronze' : undefined,
      scorecard:
        role === 'supplier'
          ? {
              overallRating: 5.0,
              dealsFulfilled: 0,
              dealsCancelled: 0,
              lockHonourRate: 100,
              avgDispatchHours: 24,
              disputePercentage: 0,
            }
          : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.parties.set(existingParty.id, existingParty);
  }

  res.json({
    success: true,
    token: `mock_jwt_token_${existingParty.id}`,
    party: existingParty,
  });
});

/**
 * Fast switcher for switching roles in testing
 */
authRouter.get('/profiles', (req: Request, res: Response) => {
  const parties = Array.from(store.parties.values());
  res.json({ parties });
});

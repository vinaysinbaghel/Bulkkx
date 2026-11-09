import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../app.module';

describe('BulkkX NestJS Fastify API Critical Flows (Milestone M0)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Requests OTP and verifies login generating JWT token', async () => {
    // 1. Request OTP
    const otpReq = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/request',
      payload: { phone: '+919876543210' },
    });

    expect(otpReq.statusCode).toBe(200);
    const otpBody = JSON.parse(otpReq.payload);
    expect(otpBody.success).toBe(true);

    // 2. Verify OTP
    const verifyReq = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/verify',
      payload: {
        phone: '+919876543210',
        otp: '123456',
        role: 'supplier',
        legalName: 'Shree Krishna Agro Traders',
      },
    });

    expect(verifyReq.statusCode).toBe(200);
    const verifyBody = JSON.parse(verifyReq.payload);
    expect(verifyBody.accessToken).toBeDefined();
    expect(verifyBody.user.role).toBe('supplier');
  });

  it('2. Admin publishes a category and verifies audit entry', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/categories',
      payload: {
        code: 'YELLOW_MAIZE',
        name: 'Yellow Maize / Corn',
        description: 'Feed and starch grade yellow maize with certified moisture',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.category.code).toBe('YELLOW_MAIZE');
  });

  it('3. Supplier creates a listing with locked price and validity window', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/listings',
      payload: {
        categoryId: 'cat-grains',
        quantity: 100,
        minOrderQuantity: 20,
        unit: 'MT',
        lockedPricePaise: 250000, // ₹2,500 / MT
        lockWindowHours: 24,
        leadTimeDays: 2,
        attributes: { grade: 'Lokwan Grade 1', moisturePercent: 11.5 },
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.lockedPricePaise).toBe(250000);
    expect(body.status).toBe('active');
    expect(body.lockExpiresAt).toBeDefined();
  });

  it('4. Buyer posts requirement and matching finds eligible listings', async () => {
    const reqRes = await app.inject({
      method: 'POST',
      url: '/v1/requirements',
      payload: {
        categoryId: 'cat-grains',
        quantity: 50,
        specs: { grade: 'Lokwan Grade 1' },
      },
    });

    expect(reqRes.statusCode).toBe(201);
    const reqBody = JSON.parse(reqRes.payload);

    const matchRes = await app.inject({
      method: 'GET',
      url: `/v1/requirements/${reqBody.id}/matches`,
    });

    expect(matchRes.statusCode).toBe(200);
  });
});

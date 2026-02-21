import request from 'supertest';
import app from '../../app';
import { ApiEndpoint } from '../../models/apiEndpointModel';
import { HealthCheck } from '../../models/healthCheckModel';
import { mockUserId } from '../factories/mockData';
import { User } from '../../models/userModel';
import bcrypt from 'bcrypt';

describe('Health Checks Integration Tests', () => {
  let authCookies: string[];
  let endpointId: string;

  beforeEach(async () => {
    await User.create({
      _id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'user',
      isActive: true,
    });

    const loginResponse = await request(app).post('/api/user/login').send({
      email: 'test@example.com',
      password: 'Password123!',
    });

    const cookies = loginResponse.headers['set-cookie'] as string | string[] | undefined;
    authCookies = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];

    const endpoint = await ApiEndpoint.create({
      userId: mockUserId,
      name: 'Test API',
      url: 'https://httpbin.org/get',
      method: 'GET',
      expectedStatus: 200,
    });
    endpointId = endpoint._id.toString();
  });

  describe('GET /api/user/endpoints/:endpointId/all-checks', () => {
    it('should return paginated health checks', async () => {
      const checks = Array.from({ length: 25 }, (_, i) => ({
        endpointId,
        userId: mockUserId,
        status: i % 2 === 0 ? 'success' : 'failure',
        responseTime: 100 + i,
        statusCode: i % 2 === 0 ? 200 : 500,
        checkedAt: new Date(Date.now() - i * 60000),
      }));
      await HealthCheck.insertMany(checks);

      const response = await request(app)
        .get(`/api/user/endpoints/${endpointId}/all-checks?page=1&limit=10`)
        .set('Cookie', authCookies);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.total).toBe(25);
      expect(response.body.pagination.totalPages).toBe(3);
    });

    it('should filter by status', async () => {
      await HealthCheck.insertMany([
        { endpointId, userId: mockUserId, status: 'success', responseTime: 100, statusCode: 200, checkedAt: new Date() },
        { endpointId, userId: mockUserId, status: 'failure', responseTime: 200, statusCode: 500, checkedAt: new Date() },
        { endpointId, userId: mockUserId, status: 'success', responseTime: 150, statusCode: 200, checkedAt: new Date() },
        { endpointId, userId: mockUserId, status: 'timeout', responseTime: 3000, checkedAt: new Date() },
      ]);

      const response = await request(app)
        .get(`/api/user/endpoints/${endpointId}/all-checks?status=success`)
        .set('Cookie', authCookies);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);

      const allSuccess = (response.body.data as Array<{ status: string }>).every(
        (c) => c.status === 'success'
      );
      expect(allSuccess).toBe(true);
    });

    it('should handle invalid status filter', async () => {
      const response = await request(app)
        .get(`/api/user/endpoints/${endpointId}/all-checks?status=invalid`)
        .set('Cookie', authCookies);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/user/endpoints/:endpointId/stats', () => {
    it('should return endpoint statistics', async () => {
      const now = Date.now();
      const checks = Array.from({ length: 10 }, (_, i) => ({
        endpointId,
        userId: mockUserId,
        status: i < 8 ? 'success' : 'failure',
        responseTime: 200 + i * 10,
        statusCode: i < 8 ? 200 : 500,
        checkedAt: new Date(now - i * 3600000),
      }));
      await HealthCheck.insertMany(checks);

      const response = await request(app)
        .get(`/api/user/endpoints/${endpointId}/stats?hours=24`)
        .set('Cookie', authCookies);

      expect(response.status).toBe(200);
      expect(response.body.data.totalChecks).toBe(10);
      expect(response.body.data.successCount).toBe(8);
      expect(response.body.data.failureCount).toBe(2);
      expect(response.body.data.uptime).toBe(80);
      expect(response.body.data.avgResponseTime).toBeGreaterThan(0);
    });
  });

  describe('POST /api/user/endpoints/:endpointId/check', () => {
    it('should trigger manual check', async () => {
      const response = await request(app)
        .post(`/api/user/endpoints/${endpointId}/check`)
        .set('Cookie', authCookies);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBeDefined();

      const checks = await HealthCheck.find({ endpointId });
      expect(checks.length).toBe(1);
    });

    it('should handle timeout errors', async () => {
      const timeoutEndpoint = await ApiEndpoint.create({
        userId: mockUserId,
        name: 'Timeout API',
        url: 'https://httpbin.org/delay/5',
        method: 'GET',
        timeout: 1000,
      });

      const response = await request(app)
        .post(`/api/user/endpoints/${timeoutEndpoint._id}/check`)
        .set('Cookie', authCookies);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('timeout');
    });
  });
});
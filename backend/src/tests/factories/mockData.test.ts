
import { mockUrls, createMockEndpoint, createMockHealthCheck, mockUserId } from './mockData';

describe('Mock Data Factory', () => {
  describe('mockUrls', () => {
    it('should have valid URLs array', () => {
      expect(mockUrls.valid).toBeDefined();
      expect(Array.isArray(mockUrls.valid)).toBe(true);
      expect(mockUrls.valid.length).toBeGreaterThan(0);
    });

    it('should have invalid URLs array', () => {
      expect(mockUrls.invalid).toBeDefined();
      expect(Array.isArray(mockUrls.invalid)).toBe(true);
      expect(mockUrls.invalid.length).toBeGreaterThan(0);
    });

    it('should have timeout URLs array', () => {
      expect(mockUrls.timeout).toBeDefined();
      expect(Array.isArray(mockUrls.timeout)).toBe(true);
    });

    it('should have serverErrors URLs array', () => {
      expect(mockUrls.serverErrors).toBeDefined();
      expect(Array.isArray(mockUrls.serverErrors)).toBe(true);
    });
  });

  describe('createMockEndpoint', () => {
    it('should create a mock endpoint with default values', () => {
      const endpoint = createMockEndpoint();

      expect(endpoint).toBeDefined();
      expect(endpoint._id).toBeDefined();
      expect(endpoint.userId).toBe(mockUserId);
      expect(endpoint.name).toBe('Test API Endpoint');
      expect(endpoint.url).toBe('https://api.example.com/test');
      expect(endpoint.method).toBe('GET');
      expect(endpoint.isActive).toBe(true);
      expect(endpoint.thresholds).toEqual({
        maxResponseTime: 5000,
        failureThreshold: 3,
      });
    });

    it('should create a mock endpoint with overrides', () => {
      const overrides = {
        name: 'Custom API',
        method: 'POST' as const,
        isActive: false,
      };

      const endpoint = createMockEndpoint(overrides);

      expect(endpoint.name).toBe('Custom API');
      expect(endpoint.method).toBe('POST');
      expect(endpoint.isActive).toBe(false);
    });
  });

  describe('createMockHealthCheck', () => {
    it('should create a mock health check with default values', () => {
      const endpointId = 'test-endpoint-id';
      const healthCheck = createMockHealthCheck(endpointId);

      expect(healthCheck).toBeDefined();
      expect(healthCheck._id).toBeDefined();
      expect(healthCheck.endpointId).toBe(endpointId);
      expect(healthCheck.userId).toBe(mockUserId);
      expect(healthCheck.status).toBe('success');
      expect(healthCheck.responseTime).toBe(250);
      expect(healthCheck.statusCode).toBe(200);
    });

    it('should create a mock health check with overrides', () => {
      const endpointId = 'test-endpoint-id';
      const overrides = {
        status: 'failure' as const,
        responseTime: 500,
        statusCode: 500,
      };

      const healthCheck = createMockHealthCheck(endpointId, overrides);

      expect(healthCheck.status).toBe('failure');
      expect(healthCheck.responseTime).toBe(500);
      expect(healthCheck.statusCode).toBe(500);
    });
  });
});
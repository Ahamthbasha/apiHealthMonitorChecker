import { ApiEndpointService } from '../../services/userService/userApiService/apiEndpointService';
import { mockUserId, createMockEndpoint } from '../factories/mockData';
import { IApiEndpointRepository } from '../../repository/userRepo/apiEndpointRepo/IApiEndpointRepo';
import { IHealthCheckRepository } from '../../repository/userRepo/healthCheckRepo/IHealthCheckRepo';
import { IWebSocketService } from '../../services/websocketService/IWebSocketService';
import { Types } from 'mongoose';

const mockEndpointRepo = {
  countByUser: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUser: jest.fn(),
  update: jest.fn(),
  toggleActive: jest.fn(),
  hardDelete: jest.fn(),
} as unknown as jest.Mocked<IApiEndpointRepository>;

const mockHealthCheckRepo = {
  deleteMany: jest.fn(),
} as unknown as jest.Mocked<IHealthCheckRepository>;

const mockWebSocket = {
  notifyEndpointDeleted: jest.fn(),
} as unknown as jest.Mocked<IWebSocketService>;

const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ApiEndpointService', () => {
  let service: ApiEndpointService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ApiEndpointService(mockEndpointRepo, mockHealthCheckRepo, mockWebSocket);
  });

  describe('validateEndpoint - Edge Cases', () => {
    it('should validate valid URLs', async () => {
      const validUrls = [
        'https://www.google.com',
        'http://example.com',
        'https://api.github.com/users',
        'http://localhost:3000/api/test',
        'https://api.example.com',
        'http://localhost:3000',
        'https://sub.domain.com/path?query=1',
        'http://192.168.1.1:8080/api',
      ];

      for (const url of validUrls) {
        const data = { name: 'Valid API', url, method: 'GET' as const };
        await expect(service.validateEndpoint(data)).resolves.toBeUndefined();
      }
    });

    it('should reject clearly invalid URLs', async () => {
      const mustFailUrls = [
        'not-a-url-at-all',
        'ftp://example.com',
        'http://',
        'https://',
        'http://.com',
        'http://invalid space.com',
        'http://example..com',
        'http://-invalid-.com',
        'http://example.com:-80',
        'http://[::1]:abc',
        'javascript:alert(1)',
        '//example.com',
        'http:/example.com',
        'https:/example.com',
      ];

      for (const url of mustFailUrls) {
        const data = { name: 'Test API', url, method: 'GET' as const };
        await expect(service.validateEndpoint(data)).rejects.toThrow(
          expect.objectContaining({ message: expect.stringContaining('Invalid URL format') })
        );
      }
    });

    it('should validate name length constraints', async () => {
      const shortName = { name: 'ab', url: 'https://api.example.com', method: 'GET' as const };
      await expect(service.validateEndpoint(shortName)).rejects.toThrow(
        'Endpoint name must be between 3 and 100 characters'
      );

      const longName = { name: 'a'.repeat(101), url: 'https://api.example.com', method: 'GET' as const };
      await expect(service.validateEndpoint(longName)).rejects.toThrow(
        'Endpoint name must be between 3 and 100 characters'
      );
    });

    it('should validate HTTP methods', async () => {
      const invalidMethods = ['PATCH', 'OPTIONS', 'HEAD', 'INVALID'];
      for (const method of invalidMethods) {
        const data = { name: 'Test API', url: 'https://api.example.com', method };
        await expect(
          service.validateEndpoint(data as { name: string; url: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE' })
        ).rejects.toThrow('Invalid HTTP method');
      }
    });

    it('should validate status code ranges', async () => {
      const invalidStatuses = [99, 600, 700];
      for (const expectedStatus of invalidStatuses) {
        const data = { name: 'Test API', url: 'https://api.example.com', method: 'GET' as const, expectedStatus };
        await expect(service.validateEndpoint(data)).rejects.toThrow(
          'Expected status code must be between 100 and 599'
        );
      }
    });

    it('should validate intervals', async () => {
      const invalidIntervals = [30, 120, 600, 1000];
      for (const interval of invalidIntervals) {
        const data = { name: 'Test API', url: 'https://api.example.com', method: 'GET' as const, interval };
        await expect(
          service.validateEndpoint(data as Parameters<typeof service.validateEndpoint>[0])
        ).rejects.toThrow('Interval must be 60, 300, or 900 seconds');
      }
    });

    it('should validate timeout ranges', async () => {
      const invalidTimeouts = [500, 35000, 100000];
      for (const timeout of invalidTimeouts) {
        const data = { name: 'Test API', url: 'https://api.example.com', method: 'GET' as const, timeout };
        await expect(service.validateEndpoint(data)).rejects.toThrow(
          'Timeout must be between 1000ms and 30000ms'
        );
      }
    });

    it('should validate thresholds', async () => {
      const data = {
        name: 'Test API',
        url: 'https://api.example.com',
        method: 'GET' as const,
        thresholds: { maxResponseTime: 50, failureThreshold: 15 },
      };
      await expect(service.validateEndpoint(data)).rejects.toThrow(
        'Max response time must be between 100ms and 30000ms'
      );
    });
  });

  describe('createEndpoint', () => {
    it('should create endpoint successfully', async () => {
      const data = { name: 'New API', url: 'https://api.example.com', method: 'GET' as const };

      (mockEndpointRepo.countByUser as jest.Mock).mockResolvedValue(5);
      (mockEndpointRepo.findOne as jest.Mock).mockResolvedValue(null);
      (mockEndpointRepo.create as jest.Mock).mockResolvedValue(createMockEndpoint());

      const result = await service.createEndpoint(mockUserId, data);

      expect(result).toBeDefined();
      expect(mockEndpointRepo.create).toHaveBeenCalled();
    });

    it('should prevent duplicate endpoint names', async () => {
      const data = { name: 'Duplicate API', url: 'https://api.example.com', method: 'GET' as const };

      (mockEndpointRepo.findOne as jest.Mock).mockResolvedValue(createMockEndpoint());

      await expect(service.createEndpoint(mockUserId, data)).rejects.toThrow(
        'An endpoint with this name already exists'
      );
    });

    it('should enforce endpoint limit', async () => {
      const data = { name: 'New API', url: 'https://api.example.com', method: 'GET' as const };

      (mockEndpointRepo.countByUser as jest.Mock).mockResolvedValue(50);

      await expect(service.createEndpoint(mockUserId, data)).rejects.toThrow(
        'Maximum endpoint limit (50) reached'
      );
    });
  });

  describe('deleteEndpoint', () => {
    it('should delete endpoint and its health checks', async () => {
      const endpointId = new Types.ObjectId().toString();
      const mockEndpoint = createMockEndpoint({ _id: new Types.ObjectId(endpointId) });

      (mockEndpointRepo.findByIdAndUser as jest.Mock).mockResolvedValue(mockEndpoint);
      (mockHealthCheckRepo.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });
      (mockEndpointRepo.hardDelete as jest.Mock).mockResolvedValue(true);

      await service.deleteEndpoint(endpointId, mockUserId);

      expect(mockHealthCheckRepo.deleteMany).toHaveBeenCalledWith({ endpointId });
      expect(mockEndpointRepo.hardDelete).toHaveBeenCalledWith(endpointId);
      expect(mockWebSocket.notifyEndpointDeleted).toHaveBeenCalledWith(endpointId, mockUserId);
    });

    it('should throw error if endpoint not found', async () => {
      const endpointId = new Types.ObjectId().toString();
      (mockEndpointRepo.findByIdAndUser as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteEndpoint(endpointId, mockUserId)).rejects.toThrow(
        'Endpoint not found'
      );
    });

    it('should handle WebSocket notification failure gracefully', async () => {
      const endpointId = new Types.ObjectId().toString();
      const mockEndpoint = createMockEndpoint({ _id: new Types.ObjectId(endpointId) });

      (mockEndpointRepo.findByIdAndUser as jest.Mock).mockResolvedValue(mockEndpoint);
      (mockHealthCheckRepo.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });
      (mockEndpointRepo.hardDelete as jest.Mock).mockResolvedValue(true);
      (mockWebSocket.notifyEndpointDeleted as jest.Mock).mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      await expect(service.deleteEndpoint(endpointId, mockUserId)).resolves.not.toThrow();
    });
  });
});
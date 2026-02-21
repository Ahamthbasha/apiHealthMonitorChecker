import { HealthCheckService } from '../../services/userService/userHealthCheckService/healthCheckService';
import { AppError } from '../../utils/errorUtil/appError';
import {
  mockUrls,
  createMockEndpoint,
  createMockHealthCheck,
  MockEndpoint,
  MockHealthCheck,
} from '../factories/mockData';
import { IHealthCheckRepository } from '../../repository/userRepo/healthCheckRepo/IHealthCheckRepo';
import { IApiEndpointRepository } from '../../repository/userRepo/apiEndpointRepo/IApiEndpointRepo';
import { IApiEndpoint } from '../../models/apiEndpointModel';
import { IHealthCheck } from '../../models/healthCheckModel';
import { Types } from 'mongoose';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

(mockedAxios as unknown as { isAxiosError: (payload: unknown) => boolean }).isAxiosError =
  jest.fn().mockImplementation((error: unknown) => {
    return (error as Record<string, unknown>)?.isAxiosError === true;
  });

interface MockAxiosError extends Error {
  code?: string;
  isAxiosError: boolean;
  response?: {
    status: number;
    data: Record<string, unknown>;
    statusText?: string;
    headers?: Record<string, string>;
  };
  request?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

function createAxiosError(
  message: string,
  overrides: Partial<Omit<MockAxiosError, 'message' | 'name' | 'stack'>> = {}
): MockAxiosError {
  const error = new Error(message) as MockAxiosError;
  error.isAxiosError = true;
  Object.assign(error, overrides);
  return error;
}


function asEndpoint(mock: MockEndpoint): IApiEndpoint {
  return mock as unknown as IApiEndpoint;
}

function asHealthCheck(mock: MockHealthCheck): IHealthCheck {
  return mock as unknown as IHealthCheck;
}

interface HealthCheckServicePrivate {
  evaluateEndpointStatus: (endpoint: IApiEndpoint, check: IHealthCheck) => Promise<void>;
  checkInProgress: Set<string>;
}

describe('HealthCheckService - Monitoring Logic & Edge Cases', () => {
  let service: HealthCheckService;
  let mockHealthCheckRepo: jest.Mocked<IHealthCheckRepository>;
  let mockEndpointRepo: jest.Mocked<IApiEndpointRepository>;

  beforeEach(() => {
    mockHealthCheckRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findLatestByEndpoint: jest.fn(),
      findLatestByUser: jest.fn(),
      findByEndpoint: jest.fn(),
      getEndpointStats: jest.fn(),
      getAllHealthChecks: jest.fn(),
      getRecentHealthChecks: jest.fn(),
      cleanOldRecords: jest.fn(),
      countByEndpoint: jest.fn(),
      deleteMany: jest.fn(),
    } as unknown as jest.Mocked<IHealthCheckRepository>;

    mockEndpointRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      countByUser: jest.fn(),
      deleteMany: jest.fn(),
    } as unknown as jest.Mocked<IApiEndpointRepository>;

    service = new HealthCheckService(mockHealthCheckRepo, mockEndpointRepo);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    service.stopMonitoring();
    jest.clearAllMocks();
  });

  describe('checkEndpoint - Timeout Handling', () => {
    it('should handle timeout errors (ECONNABORTED)', async () => {
      const endpointId = new Types.ObjectId().toString();
      const mockEndpoint = createMockEndpoint({
        _id: new Types.ObjectId(endpointId),
        url: mockUrls.timeout[0],
        timeout: 1000,
      });

      mockEndpointRepo.findById.mockResolvedValue(asEndpoint(mockEndpoint));

      const timeoutError = createAxiosError('timeout of 1000ms exceeded', { code: 'ECONNABORTED' });
      mockedAxios.request.mockRejectedValue(timeoutError);

      const mockHealthCheck = createMockHealthCheck(endpointId, {
        status: 'timeout',
        statusCode: 408,
        errorMessage: 'Request timeout after 1000ms',
      });
      mockHealthCheckRepo.create.mockResolvedValue(asHealthCheck(mockHealthCheck));

      const result = await service.checkEndpoint(endpointId);

      expect(result.status).toBe('timeout');
      expect(result.statusCode).toBe(408);
      expect(mockHealthCheckRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'timeout', statusCode: 408 })
      );
    });

    it('should handle network errors (no response)', async () => {
      const endpointId = new Types.ObjectId().toString();
      const mockEndpoint = createMockEndpoint({
        _id: new Types.ObjectId(endpointId),
        url: 'https://unreachable.example.com',
      });

      mockEndpointRepo.findById.mockResolvedValue(asEndpoint(mockEndpoint));

      const networkError = createAxiosError('Network Error', { request: {} });
      mockedAxios.request.mockRejectedValue(networkError);

      const mockHealthCheck = createMockHealthCheck(endpointId, {
        status: 'failure',
        statusCode: 0,
        errorMessage: 'No response received from server. Check if the server is reachable.',
      });
      mockHealthCheckRepo.create.mockResolvedValue(asHealthCheck(mockHealthCheck));

      const result = await service.checkEndpoint(endpointId);

      expect(result.status).toBe('failure');
      expect(result.statusCode).toBe(0);
      expect(result.errorMessage).toBeDefined();
      expect(mockHealthCheckRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failure', statusCode: 0 })
      );
    });
  });

  describe('checkEndpoint - 5xx Server Errors', () => {
    const serverErrorCases: Array<{
      name: string;
      urlIndex: number;
      statusCode: number;
      statusText: string;
    }> = [
      { name: '500 Internal Server Error', urlIndex: 0, statusCode: 500, statusText: 'Internal Server Error' },
      { name: '502 Bad Gateway', urlIndex: 1, statusCode: 502, statusText: 'Bad Gateway' },
      { name: '503 Service Unavailable', urlIndex: 2, statusCode: 503, statusText: 'Service Unavailable' },
      { name: '504 Gateway Timeout', urlIndex: 3, statusCode: 504, statusText: 'Gateway Timeout' },
    ];

    it.each(serverErrorCases)(
      'should handle $name',
      async ({ urlIndex, statusCode, statusText }) => {
        const endpointId = new Types.ObjectId().toString();
        const mockEndpoint = createMockEndpoint({
          _id: new Types.ObjectId(endpointId),
          url: mockUrls.serverErrors[urlIndex],
        });

        mockEndpointRepo.findById.mockResolvedValue(asEndpoint(mockEndpoint));
        mockedAxios.request.mockResolvedValue({
          status: statusCode,
          data: { error: statusText },
          headers: {},
          statusText,
        });

        const mockHealthCheck = createMockHealthCheck(endpointId, { status: 'failure', statusCode });
        mockHealthCheckRepo.create.mockResolvedValue(asHealthCheck(mockHealthCheck));

        const result = await service.checkEndpoint(endpointId);

        expect(result.status).toBe('failure');
        expect(result.statusCode).toBe(statusCode);
        expect(mockHealthCheckRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'failure', statusCode })
        );
      }
    );
  });

  describe('checkEndpoint - Malformed URLs', () => {
    it('should handle malformed URLs gracefully', async () => {
      const endpointId = new Types.ObjectId().toString();
      const mockEndpoint = createMockEndpoint({
        _id: new Types.ObjectId(endpointId),
        url: 'http://example.com/%%20invalid%%20encoding',
      });

      mockEndpointRepo.findById.mockResolvedValue(asEndpoint(mockEndpoint));

      const malformedError = createAxiosError('Invalid URL', { code: 'ERR_INVALID_URL' });
      mockedAxios.request.mockRejectedValue(malformedError);

      const mockHealthCheck = createMockHealthCheck(endpointId, {
        status: 'failure',
        statusCode: 0,
        errorMessage: 'Invalid URL',
      });
      mockHealthCheckRepo.create.mockResolvedValue(asHealthCheck(mockHealthCheck));

      const result = await service.checkEndpoint(endpointId);

      expect(result.status).toBe('failure');
      expect(result.statusCode).toBe(0);
      expect(result.errorMessage).toBeDefined();
      expect(mockHealthCheckRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failure', statusCode: 0 })
      );
    });
  });

  describe('Threshold Monitoring', () => {
    it('should track failure counts and trigger alert after threshold', async () => {
      const endpointId = new Types.ObjectId().toString();
      const mockEndpoint = createMockEndpoint({
        _id: new Types.ObjectId(endpointId),
        thresholds: { failureThreshold: 3, maxResponseTime: 5000 },
      });

      mockEndpointRepo.findById.mockResolvedValue(asEndpoint(mockEndpoint));

      const alertListener = jest.fn();
      service.on('threshold-exceeded', alertListener);

      const privateService = service as unknown as HealthCheckServicePrivate;

      for (let i = 0; i < 3; i++) {
        const healthCheck = createMockHealthCheck(endpointId, { status: 'failure' });
        await privateService.evaluateEndpointStatus(
          asEndpoint(mockEndpoint),
          asHealthCheck(healthCheck)
        );
      }

      expect(alertListener).toHaveBeenCalledTimes(1);
      expect(alertListener).toHaveBeenCalledWith(
        expect.objectContaining({ endpointId, failureCount: 3, threshold: 3 })
      );
    });

    it('should reset failure count after success', async () => {
      const endpointId = new Types.ObjectId().toString();
      const mockEndpoint = createMockEndpoint({
        _id: new Types.ObjectId(endpointId),
        thresholds: { failureThreshold: 3, maxResponseTime: 5000 },
      });

      mockEndpointRepo.findById.mockResolvedValue(asEndpoint(mockEndpoint));

      const privateService = service as unknown as HealthCheckServicePrivate;

      await privateService.evaluateEndpointStatus(
        asEndpoint(mockEndpoint),
        asHealthCheck(createMockHealthCheck(endpointId, { status: 'failure' }))
      );
      await privateService.evaluateEndpointStatus(
        asEndpoint(mockEndpoint),
        asHealthCheck(createMockHealthCheck(endpointId, { status: 'success' }))
      );

      const result = await service.checkThresholds(endpointId);
      expect(result).toBe(false);
    });
  });

  describe('Concurrent Checks Prevention', () => {
    it('should prevent concurrent checks of same endpoint', async () => {
      const endpointId = new Types.ObjectId().toString();
      mockEndpointRepo.findById.mockResolvedValue(asEndpoint(createMockEndpoint({ _id: new Types.ObjectId(endpointId) })));

      (service as unknown as HealthCheckServicePrivate).checkInProgress.add(endpointId);

      await expect(service.checkEndpoint(endpointId)).rejects.toThrow(
        new AppError('Check already in progress for this endpoint', 409)
      );
    });
  });

  describe('getEndpointsNeedingCheck', () => {
    it('should return endpoints that need checking based on interval', async () => {
      const endpointId1 = new Types.ObjectId().toString();
      const endpointId2 = new Types.ObjectId().toString();

      const endpoint1 = createMockEndpoint({ _id: new Types.ObjectId(endpointId1), interval: 60 });
      const endpoint2 = createMockEndpoint({ _id: new Types.ObjectId(endpointId2), interval: 300 });

      mockEndpointRepo.findAll.mockResolvedValue([
        asEndpoint(endpoint1),
        asEndpoint(endpoint2),
      ]);

      const oldCheck = createMockHealthCheck(endpointId1, { checkedAt: new Date(Date.now() - 70000) });
      const recentCheck = createMockHealthCheck(endpointId2, { checkedAt: new Date(Date.now() - 10000) });

      mockHealthCheckRepo.findLatestByEndpoint
        .mockResolvedValueOnce(asHealthCheck(oldCheck))
        .mockResolvedValueOnce(asHealthCheck(recentCheck));

      const needingCheck = await service.getEndpointsNeedingCheck();

      expect(needingCheck).toHaveLength(1);
      expect(needingCheck[0]._id.toString()).toBe(endpointId1);
    });

    it('should return endpoints with no checks', async () => {
      const endpointId = new Types.ObjectId().toString();

      mockEndpointRepo.findAll.mockResolvedValue([
        asEndpoint(createMockEndpoint({ _id: new Types.ObjectId(endpointId) })),
      ]);
      mockHealthCheckRepo.findLatestByEndpoint.mockResolvedValue(null);

      const needingCheck = await service.getEndpointsNeedingCheck();
      expect(needingCheck).toHaveLength(1);
    });
  });
});
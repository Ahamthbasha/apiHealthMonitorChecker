import axios, { AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';
import { IHealthCheckService} from './IHealthCheckService';
import { IHealthCheckRepository } from '../../../repository/userRepo/healthCheckRepo/IHealthCheckRepo';
import { IApiEndpointRepository } from '../../../repository/userRepo/apiEndpointRepo/IApiEndpointRepo';
import { IHealthCheck } from '../../../models/healthCheckModel';
import { IApiEndpoint } from '../../../models/apiEndpointModel';
import { AppError } from '../../../utils/errorUtil/appError';
import { HealthCheckDTO, HealthCheckMapper } from '../../../dto/healthCheckDTO';
import { EndpointStatsResponse, EndpointStatus, PaginatedHealthChecks, ThresholdAlert } from '../../../dto/healthCheckServiceDTO';

export class HealthCheckService extends EventEmitter implements IHealthCheckService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private failureCounts: Map<string, number> = new Map();
  private checkInProgress: Set<string> = new Set();

  constructor(
    private healthCheckRepository: IHealthCheckRepository,
    private endpointRepository: IApiEndpointRepository
  ) {
    super();
  }

  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('Monitoring engine is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting health monitoring engine...');

    this.runMonitoringCycle();

    this.monitoringInterval = setInterval(() => {
      this.runMonitoringCycle();
    }, 30000);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Health monitoring engine stopped');
  }

  private async runMonitoringCycle(): Promise<void> {
    try {
      console.log('Running monitoring cycle...');

      const endpoints = await this.getEndpointsNeedingCheck();

      console.log(`Found ${endpoints.length} endpoints that need checking`);

      const concurrencyLimit = 10;
      const chunks = this.chunkArray(endpoints, concurrencyLimit);

      for (const chunk of chunks) {
        await Promise.all(chunk.map(endpoint => this.checkEndpoint(endpoint._id.toString())));
      }
    } catch (error) {
      console.error('Error in monitoring cycle:', error);
    }
  }

  async getEndpointsNeedingCheck(): Promise<IApiEndpoint[]> {
    // Only get active endpoints for monitoring
    const activeEndpoints = await this.endpointRepository.findAll({ isActive: true });

    const endpointsNeedingCheck: IApiEndpoint[] = [];

    for (const endpoint of activeEndpoints) {
      if (this.checkInProgress.has(endpoint._id.toString())) {
        continue;
      }

      const latestCheck = await this.healthCheckRepository.findLatestByEndpoint(
        endpoint._id.toString()
      );

      if (!latestCheck) {
        endpointsNeedingCheck.push(endpoint);
        continue;
      }

      const timeSinceLastCheck = Date.now() - latestCheck.checkedAt.getTime();
      const intervalMs = endpoint.interval * 1000;

      if (timeSinceLastCheck >= intervalMs) {
        endpointsNeedingCheck.push(endpoint);
      }
    }

    return endpointsNeedingCheck;
  }

  async checkEndpoint(endpointId: string): Promise<IHealthCheck> {
    if (this.checkInProgress.has(endpointId)) {
      throw new AppError('Check already in progress for this endpoint', 409);
    }

    this.checkInProgress.add(endpointId);

    try {
      const endpoint = await this.endpointRepository.findById(endpointId);
      if (!endpoint) {
        throw new AppError('Endpoint not found', 404);
      }

      // Skip check if endpoint is not active
      if (!endpoint.isActive) {
        console.log(`Endpoint ${endpoint.name} is paused, skipping check`);
        // Return the last health check if available
        const lastCheck = await this.healthCheckRepository.findLatestByEndpoint(endpointId);
        if (lastCheck) {
          return lastCheck;
        }
        throw new AppError('Endpoint is paused and no previous checks available', 400);
      }

      console.log(`Checking endpoint: ${endpoint.name} (${endpoint.url})`);

      const config: AxiosRequestConfig = {
        method: endpoint.method,
        url: endpoint.url,
        timeout: endpoint.timeout,
        headers: Object.fromEntries(endpoint.headers || new Map()),
        validateStatus: () => true,
        maxRedirects: 5,
        decompress: true,
      };

      if (endpoint.body && ['POST', 'PUT'].includes(endpoint.method)) {
        config.data = endpoint.body;

        if (!config.headers?.['Content-Type']) {
          config.headers = {
            ...config.headers,
            'Content-Type': 'application/json',
          };
        }
      }

      const startTime = Date.now();
      let healthCheck: IHealthCheck;

      try {
        const response = await axios.request(config);
        const responseTime = Date.now() - startTime;

        const isSuccess = response.status === endpoint.expectedStatus;

        healthCheck = await this.healthCheckRepository.create({
          endpointId: endpoint._id,
          userId: endpoint.userId,
          status: isSuccess ? 'success' : 'failure',
          responseTime,
          statusCode: response.status,
          checkedAt: new Date(),
          responseHeaders: new Map(Object.entries(response.headers || {})),
          responseBody: !isSuccess
            ? JSON.stringify(response.data).substring(0, 1000)
            : undefined,
        } as IHealthCheck);

        console.log(
          `Check completed for ${endpoint.name}: ${isSuccess ? 'SUCCESS' : 'FAILURE'} (${responseTime}ms) [Status: ${response.status}]`
        );
      } catch (requestError: unknown) {
        const responseTime = Date.now() - startTime;
        healthCheck = await this.handleRequestError(endpoint, requestError, responseTime);
        console.log(
          `Check failed for ${endpoint.name}: ${healthCheck.status.toUpperCase()} (${responseTime}ms) [Status: ${healthCheck.statusCode}]`
        );
      }

      await this.evaluateEndpointStatus(endpoint, healthCheck);
      this.emit('check-completed', healthCheck);

      return healthCheck;
    } finally {
      this.checkInProgress.delete(endpointId);
    }
  }

  private async handleRequestError(
    endpoint: IApiEndpoint,
    error: unknown,         
    responseTime: number
  ): Promise<IHealthCheck> {
    let status: 'timeout' | 'failure';
    let statusCode: number;
    let errorMessage: string;

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        status = 'timeout';
        statusCode = 408;
        errorMessage = `Request timeout after ${endpoint.timeout}ms`;
      } else if (error.response) {
        status = 'failure';
        statusCode = error.response.status;
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText || 'Server error'}`;
      } else if (error.request) {
        status = 'failure';
        statusCode = 0;
        errorMessage = 'No response received from server. Check if the server is reachable.';
      } else {
        status = 'failure';
        statusCode = 0;
        errorMessage = error.message || 'Request setup failed';
      }
    } else if (error instanceof Error) {
      status = 'failure';
      statusCode = 0;
      errorMessage = error.message;
    } else {
      status = 'failure';
      statusCode = 0;
      errorMessage = 'Unknown error occurred';
    }

    return this.healthCheckRepository.create({
      endpointId: endpoint._id,
      userId: endpoint.userId,
      status,
      responseTime,
      statusCode,
      errorMessage,
      checkedAt: new Date(),
    } as IHealthCheck);
  }

  private async evaluateEndpointStatus(
    endpoint: IApiEndpoint,
    healthCheck: IHealthCheck
  ): Promise<void> {
    const endpointId = endpoint._id.toString();

    if (healthCheck.status === 'success') {
      this.failureCounts.delete(endpointId);
    } else {
      const currentFailures = this.failureCounts.get(endpointId) || 0;
      this.failureCounts.set(endpointId, currentFailures + 1);
      await this.checkThresholds(endpointId);
    }
  }

  async checkThresholds(endpointId: string): Promise<boolean> {
    const endpoint = await this.endpointRepository.findById(endpointId);
    if (!endpoint || !endpoint.isActive) return false;

    const failureCount = this.failureCounts.get(endpointId) || 0;

    if (failureCount >= endpoint.thresholds.failureThreshold) {
      const alert: ThresholdAlert = {
        endpointId,
        endpointName: endpoint.name,
        failureCount,
        threshold: endpoint.thresholds.failureThreshold,
        timestamp: new Date(),
      };

      this.emit('threshold-exceeded', alert);

      console.warn(
        `ALERT: Endpoint ${endpoint.name} has exceeded failure threshold (${failureCount}/${endpoint.thresholds.failureThreshold})`
      );
      return true;
    }

    return false;
  }

  async getEndpointHistory(endpointId: string, limit: number = 100): Promise<HealthCheckDTO[]> {
    const history = await this.healthCheckRepository.findByEndpoint(endpointId, limit);
    return HealthCheckMapper.fromLeanDocumentList(history);
  }

  async getEndpointStats(
    endpointId: string,
    hours: number = 24
  ): Promise<EndpointStatsResponse> {
    const endpoint = await this.endpointRepository.findById(endpointId);
    if (!endpoint) {
      throw new AppError('Endpoint not found', 404);
    }

    const stats = await this.healthCheckRepository.getEndpointStats(endpointId, hours);

    return {
      ...stats,
      endpointName: endpoint.name,
      endpointUrl: endpoint.url,
      period: `${hours} hours`,
    };
  }

  async getRecentHealthChecks(endpointId: string, limit: number = 10): Promise<HealthCheckDTO[]> {
    try {
      const recentChecks = await this.healthCheckRepository.getRecentHealthChecks(
        endpointId,
        limit
      );
      return HealthCheckMapper.fromLeanDocumentListDescending(recentChecks);
    } catch (error) {
      console.error('Error getting recent health checks:', error);
      throw new AppError('Failed to fetch recent health checks', 500);
    }
  }

  async getUserEndpointsStatus(userId: string): Promise<EndpointStatus[]> {
    const endpoints = await this.endpointRepository.findByUser(userId);
    const statuses: EndpointStatus[] = [];

    for (const endpoint of endpoints) {
      const latestCheck = await this.healthCheckRepository.findLatestByEndpoint(
        endpoint._id.toString()
      );

      const stats = await this.healthCheckRepository.getEndpointStats(
        endpoint._id.toString(),
        24
      );

      const failureCount = this.failureCounts.get(endpoint._id.toString()) || 0;

      let status: 'up' | 'down' | 'degraded' | 'inactive' = 'inactive';

      if (endpoint.isActive) {
        if (failureCount >= endpoint.thresholds.failureThreshold) {
          status = 'down';
        } else if (failureCount > 0) {
          status = 'degraded';
        } else if (latestCheck) {
          status =
            latestCheck.status === 'success'
              ? 'up'
              : latestCheck.status === 'timeout'
              ? 'degraded'
              : 'down';
        } else {
          status = 'up';
        }
      }

      statuses.push({
        endpointId: endpoint._id.toString(),
        name: endpoint.name,
        url: endpoint.url,
        status,
        lastChecked: latestCheck?.checkedAt || new Date(0),
        lastResponseTime: latestCheck?.responseTime || 0,
        uptime: stats.uptime,
        currentFailureCount: failureCount,
        interval: endpoint.interval,
        totalChecks: stats.totalChecks,
        isActive: endpoint.isActive,
      });
    }

    return statuses;
  }

  async getAllHealthChecks(
    endpointId: string,
    page: number = 1,
    limit: number = 20,
    status: string = 'all'
  ): Promise<PaginatedHealthChecks> {
    try {
      const endpoint = await this.endpointRepository.findById(endpointId);
      if (!endpoint) {
        throw new AppError('Endpoint not found', 404);
      }

      const result = await this.healthCheckRepository.getAllHealthChecks(
        endpointId,
        page,
        limit,
        status !== 'all' ? status : undefined
      );

      return {
        data: HealthCheckMapper.fromLeanDocumentListHealthCheckTable(result.data),
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit,
      };
    } catch (error) {
      console.error('Error getting all health checks:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch health checks', 500);
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
import { IApiEndpointRepository } from '../../../repository/userRepo/apiEndpointRepo/IApiEndpointRepo';
import { IApiEndpointService} from './IApiEndpointService';
import { IApiEndpoint, IApiEndpointData } from '../../../models/apiEndpointModel';
import { AppError } from '../../../utils/errorUtil/appError';
import { IHealthCheckRepository } from '../../../repository/userRepo/healthCheckRepo/IHealthCheckRepo';
import { IWebSocketService } from '../../websocketService/IWebSocketService';
import { CreateEndpointDTO,UpdateEndpointDTO,EndpointUpdatePayload } from '../../../dto/endpointDTO';


export class ApiEndpointService implements IApiEndpointService {
  constructor(
    private endpointRepository: IApiEndpointRepository,
    private healthCheckRepository: IHealthCheckRepository,
    private webSocketService?: IWebSocketService
  ) {}

  async validateEndpoint(data: CreateEndpointDTO): Promise<void> {
    if (!data.name || data.name.length < 3 || data.name.length > 100) {
      throw new AppError('Endpoint name must be between 3 and 100 characters', 400);
    }

    if (!data.url || typeof data.url !== 'string') {
      throw new AppError('Invalid URL format. Must include http:// or https://', 400);
    }

    if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
      throw new AppError('Invalid URL format. Must include http:// or https://', 400);
    }

    if (data.url === 'https://' || data.url === 'http://') {
      throw new AppError('Invalid URL format. Must include http:// or https://', 400);
    }

    const afterProtocol = data.url.split('://')[1];
    if (!afterProtocol || afterProtocol.length === 0) {
      throw new AppError('Invalid URL format. Must include http:// or https://', 400);
    }

    let url: URL;
    try {
      url = new URL(data.url);
    } catch {
      if (data.url.includes(' ')) {
        throw new AppError('Invalid URL format. Must include http:// or https://', 400);
      }
      if (/:\/\/[^:]+:port\b/.test(data.url)) {
        throw new AppError('Invalid URL format. Must include http:// or https://', 400);
      }
      if (data.url.includes('%') || /%(?![0-9a-fA-F]{2})/.test(data.url)) {
        throw new AppError('Invalid URL format. Must include http:// or https://', 400);
      }
      throw new AppError('Invalid URL format. Must include http:// or https://', 400);
    }

    if (!url.hostname || url.hostname.length === 0) {
      throw new AppError('Invalid URL format. Must include http:// or https://', 400);
    }

    if (
      url.hostname.includes('..') ||
      url.hostname.startsWith('.') ||
      url.hostname.endsWith('.') ||
      url.hostname.includes(' ')
    ) {
      throw new AppError('Invalid URL format. Must include http:// or https://', 400);
    }

    const tldOnlyHostnames = ['.com', '.org', '.net', '.io', '.gov', '.edu'];
    if (tldOnlyHostnames.includes(url.hostname)) {
      throw new AppError('Invalid URL format. Must include http:// or https://', 400);
    }

    if (url.port) {
      if (!/^\d+$/.test(url.port)) {
        throw new AppError('Invalid URL format. Must include http:// or https://', 400);
      }
      const port = parseInt(url.port, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new AppError('Invalid URL format. Must include http:// or https://', 400);
      }
    }

    if (url.hostname.startsWith('[') && url.hostname.endsWith(']')) {
      const ipv6 = url.hostname.slice(1, -1);
      if (!ipv6.includes(':') || !/^[0-9a-fA-F:]+$/.test(ipv6)) {
        throw new AppError('Invalid URL format. Must include http:// or https://', 400);
      }
    }

    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(url.hostname);
    const isIPv6 = url.hostname.startsWith('[') && url.hostname.endsWith(']');

    if (!isLocalhost && !isIPv4 && !isIPv6) {
      if (!url.hostname.includes('.')) {
        throw new AppError('Invalid URL format. Must include http:// or https://', 400);
      }

      const parts = url.hostname.split('.');
      const tld = parts[parts.length - 1];
      if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
        throw new AppError('Invalid URL format. Must include http:// or https://', 400);
      }

      for (const part of parts) {
        if (part.length === 0 || part.length > 63) {
          throw new AppError('Invalid URL format. Must include http:// or https://', 400);
        }
        if (part.startsWith('-') || part.endsWith('-')) {
          throw new AppError('Invalid URL format. Must include http:// or https://', 400);
        }
        if (!/^[a-zA-Z0-9-]+$/.test(part)) {
          throw new AppError('Invalid URL format. Must include http:// or https://', 400);
        }
      }
    }

    if (data.url.includes('%') && !/%[0-9a-fA-F]{2}/g.test(data.url)) {
      throw new AppError('Invalid URL format. Must include http:// or https://', 400);
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new AppError('Invalid URL format. Must include http:// or https://', 400);
    }

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (!validMethods.includes(data.method)) {
      throw new AppError('Invalid HTTP method', 400);
    }

    if (data.expectedStatus && (data.expectedStatus < 100 || data.expectedStatus > 599)) {
      throw new AppError('Expected status code must be between 100 and 599', 400);
    }

    const validIntervals = [60, 300, 900];
    if (data.interval && !validIntervals.includes(data.interval)) {
      throw new AppError('Interval must be 60, 300, or 900 seconds', 400);
    }

    if (data.timeout && (data.timeout < 1000 || data.timeout > 30000)) {
      throw new AppError('Timeout must be between 1000ms and 30000ms', 400);
    }

    if (data.thresholds) {
      if (
        data.thresholds.maxResponseTime &&
        (data.thresholds.maxResponseTime < 100 || data.thresholds.maxResponseTime > 30000)
      ) {
        throw new AppError('Max response time must be between 100ms and 30000ms', 400);
      }

      if (
        data.thresholds.failureThreshold &&
        (data.thresholds.failureThreshold < 1 || data.thresholds.failureThreshold > 10)
      ) {
        throw new AppError('Failure threshold must be between 1 and 10', 400);
      }
    }
  }

  async createEndpoint(userId: string, data: CreateEndpointDTO): Promise<IApiEndpoint> {
    await this.validateEndpoint(data);

    const endpointCount = await this.endpointRepository.countByUser(userId);
    if (endpointCount >= 50) {
      throw new AppError('Maximum endpoint limit (50) reached', 400);
    }

    const existing = await this.endpointRepository.findOne({ userId, name: data.name });
    if (existing) {
      throw new AppError('An endpoint with this name already exists', 409);
    }

    const endpoint = await this.endpointRepository.create({
      userId,
      name: data.name,
      url: data.url,
      method: data.method,
      headers: data.headers ? new Map(Object.entries(data.headers)) : new Map(),
      body: data.body,
      expectedStatus: data.expectedStatus || 200,
      interval: data.interval || 300,
      timeout: data.timeout || 10000,
      thresholds: {
        maxResponseTime: data.thresholds?.maxResponseTime || 5000,
        failureThreshold: data.thresholds?.failureThreshold || 3,
      },
      isActive: true,
    } as IApiEndpoint);

    return endpoint;
  }

  async getEndpointById(id: string, userId: string): Promise<IApiEndpoint> {
    const endpoint = await this.endpointRepository.findByIdAndUser(id, userId);
    if (!endpoint) {
      throw new AppError('Endpoint not found', 404);
    }
    return endpoint;
  }

  async updateEndpoint(id: string, userId: string, data: UpdateEndpointDTO): Promise<IApiEndpoint> {
    const existing = await this.getEndpointById(id, userId);

    if (data.name && data.name !== existing.name) {
      const duplicate = await this.endpointRepository.findOne({
        userId,
        name: data.name,
        _id: { $ne: id },
      });
      if (duplicate) {
        throw new AppError('An endpoint with this name already exists', 409);
      }
    }

    const updateData: EndpointUpdatePayload = {};

    if (data.name) updateData.name = data.name;
    if (data.url) updateData.url = data.url;
    if (data.method) updateData.method = data.method;
    if (data.headers) updateData.headers = new Map(Object.entries(data.headers));
    if (data.body !== undefined) updateData.body = data.body;
    if (data.expectedStatus) updateData.expectedStatus = data.expectedStatus;
    if (data.interval) updateData.interval = data.interval;
    if (data.timeout) updateData.timeout = data.timeout;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.thresholds) {
      updateData.thresholds = {
        maxResponseTime: data.thresholds.maxResponseTime ?? existing.thresholds.maxResponseTime,
        failureThreshold: data.thresholds.failureThreshold ?? existing.thresholds.failureThreshold,
      };
    }

    const updated = await this.endpointRepository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update endpoint', 500);
    }

    return updated;
  }

  async deleteEndpoint(id: string, userId: string): Promise<void> {
    await this.getEndpointById(id, userId);

    await this.healthCheckRepository.deleteMany({ endpointId: id });

    const deleted = await this.endpointRepository.hardDelete(id);
    if (!deleted) {
      throw new AppError('Failed to delete endpoint', 500);
    }

    if (this.webSocketService) {
      try {
        this.webSocketService.notifyEndpointDeleted(id, userId);
        console.log(`📢 WebSocket notification sent for deleted endpoint ${id}`);
      } catch (error) {
        console.error('Failed to send WebSocket notification:', error);
      }
    }
  }

  async toggleEndpoint(id: string, userId: string): Promise<IApiEndpoint> {
    const endpoint = await this.endpointRepository.toggleActive(id, userId);
    if (!endpoint) {
      throw new AppError('Endpoint not found', 404);
    }
    return endpoint;
  }
}

import { IApiEndpointRepository } from "../../../repository/userRepo/apiEndpointRepo/IApiEndpointRepo"; 
import { IApiEndpointService, CreateEndpointDTO, UpdateEndpointDTO } from "./IApiEndpointService";
import { IApiEndpoint } from "../../../models/apiEndpointModel"; 
import { AppError } from "../../../utils/errorUtil/appError"; 
import validator from 'validator';

export class ApiEndpointService implements IApiEndpointService {
  constructor(
    private endpointRepository: IApiEndpointRepository
  ) {}

  async validateEndpoint(data: CreateEndpointDTO): Promise<void> {
    // Validate URL
    if (!validator.isURL(data.url, { 
      protocols: ['http', 'https'],
      require_protocol: true 
    })) {
      throw new AppError('Invalid URL format. Must include http:// or https://', 400);
    }

    // Validate name
    if (data.name.length < 3 || data.name.length > 100) {
      throw new AppError('Endpoint name must be between 3 and 100 characters', 400);
    }

    // Validate HTTP method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (!validMethods.includes(data.method)) {
      throw new AppError('Invalid HTTP method', 400);
    }

    // Validate expected status code
    if (data.expectedStatus && (data.expectedStatus < 100 || data.expectedStatus > 599)) {
      throw new AppError('Expected status code must be between 100 and 599', 400);
    }

    // Validate interval
    const validIntervals = [60, 300, 900];
    if (data.interval && !validIntervals.includes(data.interval)) {
      throw new AppError('Interval must be 60, 300, or 900 seconds', 400);
    }

    // Validate timeout
    if (data.timeout && (data.timeout < 1000 || data.timeout > 30000)) {
      throw new AppError('Timeout must be between 1000ms and 30000ms', 400);
    }

    // Validate thresholds
    if (data.thresholds) {
      if (data.thresholds.maxResponseTime && 
          (data.thresholds.maxResponseTime < 100 || data.thresholds.maxResponseTime > 30000)) {
        throw new AppError('Max response time must be between 100ms and 30000ms', 400);
      }
      
      if (data.thresholds.failureThreshold && 
          (data.thresholds.failureThreshold < 1 || data.thresholds.failureThreshold > 10)) {
        throw new AppError('Failure threshold must be between 1 and 10', 400);
      }
    }
  }

  async createEndpoint(userId: string, data: CreateEndpointDTO): Promise<IApiEndpoint> {
    // Validate input
    await this.validateEndpoint(data);

    // Check endpoint limit (optional - prevent abuse)
    const endpointCount = await this.endpointRepository.countByUser(userId);
    if (endpointCount >= 50) {
      throw new AppError('Maximum endpoint limit (50) reached', 400);
    }

    // Check for duplicate name
    const existing = await this.endpointRepository.findOne({ 
      userId, 
      name: data.name 
    });
    
    if (existing) {
      throw new AppError('An endpoint with this name already exists', 409);
    }

    // Create endpoint
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
        failureThreshold: data.thresholds?.failureThreshold || 3
      },
      isActive: true
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
    // Verify ownership
    const existing = await this.getEndpointById(id, userId);

    // If name is being updated, check for duplicates
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.endpointRepository.findOne({ 
        userId, 
        name: data.name,
        _id: { $ne: id } 
      });
      
      if (duplicate) {
        throw new AppError('An endpoint with this name already exists', 409);
      }
    }

    // Prepare update data
    const updateData: any = {};
    
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
        maxResponseTime: data.thresholds.maxResponseTime || existing.thresholds.maxResponseTime,
        failureThreshold: data.thresholds.failureThreshold || existing.thresholds.failureThreshold
      };
    }

    const updated = await this.endpointRepository.update(id, updateData);
    
    if (!updated) {
      throw new AppError('Failed to update endpoint', 500);
    }

    return updated;
  }

  async deleteEndpoint(id: string, userId: string): Promise<void> {
    // Verify ownership
    await this.getEndpointById(id, userId);

    // Soft delete by setting isActive to false
    await this.endpointRepository.update(id, { isActive: false });
  }

  async toggleEndpoint(id: string, userId: string): Promise<IApiEndpoint> {
    const endpoint = await this.endpointRepository.toggleActive(id, userId);
    
    if (!endpoint) {
      throw new AppError('Endpoint not found', 404);
    }

    return endpoint;
  }
}
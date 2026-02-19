
import { IApiEndpoint } from "../../../models/apiEndpointModel"; 

export interface CreateEndpointDTO {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  expectedStatus?: number;
  interval?: 60 | 300 | 900;
  timeout?: number;
  thresholds?: {
    maxResponseTime?: number;
    failureThreshold?: number;
  };
}

export interface UpdateEndpointDTO {
  name?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  expectedStatus?: number;
  interval?: 60 | 300 | 900;
  timeout?: number;
  isActive?: boolean;
  thresholds?: {
    maxResponseTime?: number;
    failureThreshold?: number;
  };
}

export interface IApiEndpointService {
  createEndpoint(userId: string, data: CreateEndpointDTO): Promise<IApiEndpoint>;
  getEndpointById(id: string, userId: string): Promise<IApiEndpoint>;
  updateEndpoint(id: string, userId: string, data: UpdateEndpointDTO): Promise<IApiEndpoint>;
  deleteEndpoint(id: string, userId: string): Promise<void>;
  toggleEndpoint(id: string, userId: string): Promise<IApiEndpoint>;
  validateEndpoint(data: CreateEndpointDTO): Promise<void>;
}
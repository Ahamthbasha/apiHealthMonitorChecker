// src/types/interface/apiInterface.ts
export interface ApiEndpoint {
  _id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  expectedStatus: number;
  interval: 60 | 300 | 900;
  timeout: number;
  isActive: boolean;
  thresholds: {
    maxResponseTime: number;
    failureThreshold: number;
  };
  createdAt: string;
  updatedAt: string;
}

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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface EndpointStatus {
  endpointId: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded';
  lastChecked: string;
  responseTime: number;
  uptime: number;
  currentFailureCount: number;
}
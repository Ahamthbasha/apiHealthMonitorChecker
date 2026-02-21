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

export type EndpointUpdatePayload = {
  name?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Map<string, string>;
  body?: string;
  expectedStatus?: number;
  interval?: 60 | 300 | 900;
  timeout?: number;
  isActive?: boolean;
  thresholds?: {
    maxResponseTime: number;
    failureThreshold: number;
  };
};

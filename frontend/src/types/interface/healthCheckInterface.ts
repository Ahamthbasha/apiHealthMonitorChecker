export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
  message: string;
}


export interface HealthCheckDTO {
  id: string;
  endpointId: string;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string;
  formattedTime:string;
  formattedDateTime:string;
}

export interface HealthCheck {
  _id: string;
  endpointId: string;
  userId: string;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EndpointStatus {
  endpointId: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded';
  lastChecked: string;
  lastResponseTime: number;
  uptime: number;
  currentFailureCount: number;
  interval?: number;
  thresholds?: {
    maxResponseTime: number;
    failureThreshold: number;
  };
}

export interface EndpointStats {
  totalChecks: number;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  avgResponseTime: number;
  uptime: number;
  endpointName: string;
  endpointUrl: string;
  period: string;
}
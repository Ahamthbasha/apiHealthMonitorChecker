
export interface HealthCheck {
  _id: string;
  endpointId: string;
  userId: string;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckDTO {
  id: string;
  endpointId: string;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string;
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

export interface DashboardMetrics {
  totalEndpoints: number;
  activeEndpoints: number;
  inactiveEndpoints: number;
  totalChecks: number;
  avgResponseTime: number;
  overallUptime: number;
  endpointsAtRisk: number;
}

// Add to ApiResponse type if not already there
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
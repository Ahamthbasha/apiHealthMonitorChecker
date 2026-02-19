// types/dashboard.ts

export interface EndpointStatus {
  endpointId: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded';
  lastChecked: string;
  lastResponseTime: number;
  uptime: number;
  currentFailureCount: number;
}

export interface LiveMetrics {
  total: number;
  up: number;
  degraded: number;
  down: number;
  avgResponse: number;
  avgUptime: number;
}

export interface HealthCheckDTO {
  id: string;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string;
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

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export type TimeRange = '1h' | '24h' | '7d' | '30d';
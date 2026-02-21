export interface HealthCheck {
  id: string;
  endpointId: string;
  userId?: string;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string;
  timestamp?: number;
  formattedTime?: string;
  formattedDateTime?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface EndpointStatus {
  endpointId: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded' | 'inactive';
  lastChecked: string;
  lastResponseTime: number;
  uptime: number;
  currentFailureCount: number;
  interval: number;
  totalChecks: number;
  isActive: boolean; 
  thresholds?: {
    maxResponseTime: number;
    failureThreshold: number;
  };
}

export interface LiveMetrics {
  total: number;
  up: number;
  degraded: number;
  down: number;
  avgResponse: number;
  avgUptime: number;
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
  isActive?: boolean; 
}

export interface Endpoint {
  _id: string;
  name: string;
  url: string;
  method: string;
  isActive: boolean;
  interval: number;
  timeout: number;
  expectedStatus: number;
  thresholds: {
    maxResponseTime: number;
    failureThreshold: number;
  };
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export type TimeRange = '1h' | '24h' | '7d' | '30d';

export interface InitialData {
  endpoints: Endpoint[];
  statuses: EndpointStatus[];
  recentChecks: Record<string, HealthCheck[]>;
  metrics: LiveMetrics;
  timestamp: string;
}

export interface ThresholdAlert {
  endpointId: string;
  endpointName: string;
  failureCount: number;
  threshold: number;
  timestamp: string;
  message: string;
}

export interface EndpointLatestData {
  endpointId: string;
  history: HealthCheck[];
  stats: EndpointStats;
  timestamp: string;
}

export interface EndpointHistoryData {
  endpointId: string;
  history: HealthCheck[];
  timestamp: string;
}

export interface LiveStatsData {
  statuses: EndpointStatus[];
  metrics: LiveMetrics;
  timestamp: string;
}

export interface EndpointUpdatedData {
  endpointId: string;
  check: HealthCheck;
  timestamp: string;
}

export interface ConnectionStatusData {
  connected: boolean;
  reason?: string;
}

export interface ErrorData {
  message: string;
  code?: string;
}

export interface EndpointDeletedData {
  endpointId: string;
  timestamp: string;
}

export type EventPayloadMap = {
  'connection-status': ConnectionStatusData;
  'initial-data': InitialData;
  'endpoint-updated': EndpointUpdatedData;
  'threshold-alert': ThresholdAlert;
  'live-stats': LiveStatsData;
  'endpoint-latest-data': EndpointLatestData;
  'endpoint-history': EndpointHistoryData;
  'error': ErrorData;
  'endpoint-deleted': EndpointDeletedData;
};
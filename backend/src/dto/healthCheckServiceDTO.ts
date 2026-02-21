
import { HealthCheckDTO } from '../dto/healthCheckDTO';
import { IHealthCheck } from '../models/healthCheckModel';

export interface EndpointStatus {
  endpointId: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded' | 'inactive';
  lastChecked: Date;
  lastResponseTime: number;
  uptime: number;
  currentFailureCount: number;
  interval: number;
  totalChecks: number;
  isActive: boolean;
}

export interface PaginatedHealthChecks {
  data: HealthCheckDTO[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface HealthCheckEvents {
  'check-completed': (result: IHealthCheck) => void;
  'threshold-exceeded': (alert: ThresholdAlert) => void;
}

export interface ThresholdAlert {
  endpointId: string;
  endpointName: string;
  failureCount: number;
  threshold: number;
  timestamp: Date;
}

export interface EndpointStatsResponse {
  totalChecks: number;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  avgResponseTime: number;
  uptime: number;
  latestResponseTime?: number;
  latestStatus?: string;
  latestCheckedAt?: Date;
  endpointName: string;
  endpointUrl: string;
  period: string;
}


import type { TimeRange } from '../../../../types/healthCheck';

export interface StatsBarProps {
  stats: {
    totalChecks: number;
    successCount: number;
    failureCount: number;
    timeoutCount: number;
    avgResponseTime: number;
    uptime: number;
    endpointName: string;
    endpointUrl: string;
    period: string;
    latestResponseTime?: number;
    latestStatus?: string;
    latestCheckedAt?: string;
    isActive?: boolean;
  };
  timeRange: TimeRange;
  onTimeRangeChange: (r: TimeRange) => void;
}
import { type TimeRange, type HealthCheck } from '../../../../types/healthCheck';

export interface ResponseTimeChartProps {
  data: HealthCheck[];
  timeRange?: TimeRange;
  height?: number;
  isPaused?:boolean
}

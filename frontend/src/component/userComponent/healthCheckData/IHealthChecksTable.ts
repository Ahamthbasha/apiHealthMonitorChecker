import type { HealthCheckDTO } from '../../../types/interface/healthCheckInterface';

export interface HealthChecksTableProps {
  checks: HealthCheckDTO[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  statusFilter: string;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onStatusFilterChange: (status: string) => void;
  loading?: boolean;
  error?: string | null;
  endpointName?: string;
  className?: string;
  showEndpointInfo?: boolean;
}
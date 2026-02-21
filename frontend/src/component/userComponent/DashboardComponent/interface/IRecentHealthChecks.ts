import type { HealthCheckDTO } from "../../../../types/interface/healthCheckInterface";

export interface RecentHealthChecksProps {
  checks: HealthCheckDTO[];
  loading?: boolean;
  error?: string | null;
  endpointName?: string;
  isActive?: boolean;
  className?: string;
}
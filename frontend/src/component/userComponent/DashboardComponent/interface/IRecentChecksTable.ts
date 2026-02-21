import { type HealthCheck } from '../../../../types/healthCheck';
export interface RecentChecksTableProps {
  history: HealthCheck[];
  onViewAll: () => void;
}
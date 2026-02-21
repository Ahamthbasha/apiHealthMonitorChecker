import type { ApiEndpoint } from "../../../types/interface/apiInterface";

export interface EndpointDetailsCardProps {
  endpoint: ApiEndpoint;
  onEdit?: () => void;
  onDelete?: () => void;
  onManualCheck?: () => void;
  onToggle?: () => void;
  className?: string;
}

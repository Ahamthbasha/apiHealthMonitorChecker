import { type EndpointStatus } from "../../../../types/healthCheck"; 

export interface EndpointHeaderProps {
  endpoint: EndpointStatus;
  isConnected: boolean;
  onManualCheck: () => Promise<void> | void;
  onToggle: () => Promise<void> | void;
  onEdit: () => void;
  onDelete: () => void;
  isToggling?: boolean;
  isChecking?: boolean;
}
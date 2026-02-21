import type { ToastItem } from "../../../../types/healthCheck";

export interface ToastProps extends ToastItem {
  onClose: () => void;
}

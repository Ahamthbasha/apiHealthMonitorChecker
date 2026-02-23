import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../config/config";
import axios from "axios";
import type { HealthCheckDTO } from "../types/interface/healthCheckInterface";

export interface HealthCheckData {
  id: string;
  endpointId: string;
  status: "success" | "failure" | "timeout";
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string;
  timestamp: number;
  formattedTime: string;
  formattedDateTime: string;
}

export interface EndpointStatus {
  endpointId: string;
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | "inactive";
  lastChecked: string;
  lastResponseTime: number;
  uptime: number;
  currentFailureCount: number;
  interval: number;
  totalChecks: number;
  isActive: boolean;
}

export interface LiveMetrics {
  total: number;
  up: number;
  degraded: number;
  down: number;
  avgResponse: number;
  avgUptime: number;
}

export interface EndpointData {
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
}

export interface InitialData {
  endpoints: EndpointData[];
  statuses: EndpointStatus[];
  recentChecks: Record<string, HealthCheckData[]>;
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
}

export interface EndpointLatestData {
  endpointId: string;
  history: HealthCheckData[];
  stats: EndpointStats;
  timestamp: string;
}

export interface EndpointHistoryData {
  endpointId: string;
  history: HealthCheckData[];
  timestamp: string;
}

export interface LiveStatsData {
  statuses: EndpointStatus[];
  metrics: LiveMetrics;
  timestamp: string;
}

export interface EndpointUpdatedData {
  endpointId: string;
  check: HealthCheckDTO;
  timestamp: string;
}

export interface ErrorData {
  message: string;
  code?: string;
}

export interface ConnectionStatusData {
  connected: boolean;
  reason?: string;
}

export interface TokenExpiringData {
  message: string;
}

// Define event payload types
export type EventPayloadMap = {
  "connection-status": ConnectionStatusData;
  "initial-data": InitialData;
  "endpoint-updated": EndpointUpdatedData;
  "threshold-alert": ThresholdAlert;
  "live-stats": LiveStatsData;
  "endpoint-latest-data": EndpointLatestData;
  "endpoint-history": EndpointHistoryData;
  "token-expiring": TokenExpiringData;
  "token-refresh-acknowledged": Record<string, never>;
  error: ErrorData;
  "endpoint-deleted": { endpointId: string; timestamp: string };
};

// Define event types with proper interfaces
export type EventMap = {
  [K in keyof EventPayloadMap]: (data: EventPayloadMap[K]) => void;
};

// Type for event listener callbacks
type EventCallback<T extends keyof EventMap> = EventMap[T];

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<keyof EventMap, Set<EventCallback<keyof EventMap>>> =
    new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionPromise: Promise<void> | null = null;
  private subscribedEndpoints: Set<string> = new Set();
  private refreshInProgress = false;

  /**
   * Connect to WebSocket server - cookies are sent automatically
   */
  connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.socket?.connected) {
      return Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log("🔌 Connecting to WebSocket server...", API_BASE_URL);

        const wsUrl = API_BASE_URL.replace(/^http/, "ws");

        this.socket = io(wsUrl, {
          transports: ["websocket"],
          withCredentials: true, // This sends cookies automatically
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 5000,
          timeout: 10000,
          forceNew: true,
        });

        this.setupEventHandlers(resolve, reject);
      } catch (error) {
        this.connectionPromise = null;
        console.error("Failed to create socket connection:", error);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private setupEventHandlers(
    resolve: () => void,
    reject: (error: Error) => void,
  ): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected with ID:", this.socket?.id);
      this.reconnectAttempts = 0;
      this.connectionPromise = null;
      this.emit("connection-status", { connected: true });

      // Resubscribe to all previously subscribed endpoints
      this.subscribedEndpoints.forEach((endpointId) => {
        this.subscribeToEndpoint(endpointId);
      });

      resolve();
    });

    // Connection error
    this.socket.on("connect_error", (error: Error) => {
      console.error("❌ WebSocket connection error:", error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit("connection-status", {
          connected: false,
          reason: "Max reconnection attempts reached",
        });
        reject(
          new Error(
            "Failed to connect to WebSocket server after multiple attempts",
          ),
        );
        this.connectionPromise = null;
      }
    });

    // Authentication error
    this.socket.on("connect_error", (error: Error) => {
      if (
        error.message === "Authentication required" ||
        error.message === "Invalid token"
      ) {
        console.error("❌ WebSocket authentication failed");
        this.emit("connection-status", {
          connected: false,
          reason: "Authentication failed",
        });
        reject(new Error("Authentication failed"));
        this.connectionPromise = null;
      }
    });

    // Disconnect
    this.socket.on("disconnect", (reason: string) => {
      console.log("🔌 WebSocket disconnected:", reason);
      this.emit("connection-status", { connected: false, reason });

      if (reason === "io server disconnect") {
        // Server disconnected, attempt reconnect
        this.socket?.connect();
      }
    });

    // Reconnection attempts
    this.socket.on("reconnect_attempt", (attempt: number) => {
      console.log(`Reconnection attempt ${attempt}`);
      this.reconnectAttempts = attempt;
    });

    this.socket.on("reconnect", (attempt: number) => {
      console.log(`Reconnected after ${attempt} attempts`);
      this.emit("connection-status", { connected: true });
    });

    this.socket.on("reconnect_failed", () => {
      console.error(
        "Failed to reconnect after",
        this.maxReconnectAttempts,
        "attempts",
      );
      this.emit("connection-status", {
        connected: false,
        reason: "reconnect_failed",
      });
    });

    // Handle token expiring event
    this.socket.on("token-expiring", async (data: TokenExpiringData) => {
      console.log("⚠️ Token expiring soon:", data.message);
      await this.refreshTokenViaHttp();
    });

    // Handle token refresh acknowledgment
    this.socket.on("token-refresh-acknowledged", () => {
      console.log("✅ Token refresh acknowledged by server");
    });

    // Handle custom events
    this.socket.on("initial-data", (data: InitialData) => {
      try {
        console.log(
          "📦 Received initial data with",
          data.statuses?.length || 0,
          "endpoints",
        );
        this.emit("initial-data", data);
      } catch (error) {
        console.error("Error handling initial-data event:", error);
      }
    });

    this.socket.on("endpoint-updated", (data: EndpointUpdatedData) => {
      try {
        if (this.subscribedEndpoints.has(data.endpointId)) {
          console.log(
            `Endpoint ${data.endpointId} updated with status:`,
            data.check?.status,
          );
          this.emit("endpoint-updated", data);
        }
      } catch (error) {
        console.error("Error handling endpoint-updated event:", error);
      }
    });

    this.socket.on("threshold-alert", (alert: ThresholdAlert) => {
      try {
        console.warn("Threshold alert:", alert);
        this.emit("threshold-alert", alert);
      } catch (error) {
        console.error("Error handling threshold-alert event:", error);
      }
    });

    this.socket.on("live-stats", (data: LiveStatsData) => {
      try {
        this.emit("live-stats", data);
      } catch (error) {
        console.error("Error handling live-stats event:", error);
      }
    });

    this.socket.on("endpoint-latest-data", (data: EndpointLatestData) => {
      try {
        this.emit("endpoint-latest-data", data);
      } catch (error) {
        console.error("Error handling endpoint-latest-data event:", error);
      }
    });

    this.socket.on("endpoint-history", (data: EndpointHistoryData) => {
      try {
        this.emit("endpoint-history", data);
      } catch (error) {
        console.error("Error handling endpoint-history event:", error);
      }
    });

    this.socket.on(
      "endpoint-deleted",
      (data: { endpointId: string; timestamp: string }) => {
        try {
          console.log(`Endpoint ${data.endpointId} deleted from server`);
          this.subscribedEndpoints.delete(data.endpointId);
          this.emit("endpoint-deleted", data);
        } catch (error) {
          console.error("Error handling endpoint-deleted event:", error);
        }
      },
    );

    this.socket.on("error", (error: ErrorData) => {
      console.error("WebSocket error:", error);
      this.emit("error", error);
    });
  }

  /**
   * Refresh token via HTTP endpoint - this will update cookies automatically
   */
  private async refreshTokenViaHttp(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshInProgress) {
      console.log("Token refresh already in progress");
      return false;
    }

    this.refreshInProgress = true;

    try {
      console.log("🔄 Refreshing token via HTTP...");
      
      // Call any protected endpoint - the auth middleware will refresh the token
      // and set new cookies automatically
      const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        withCredentials: true,
        timeout: 10000
      });

      if (response.status === 200) {
        console.log("✅ Token refreshed successfully via HTTP");
        
        // Notify server that we've refreshed
        if (this.socket?.connected) {
          this.socket.emit("request-token-refresh");
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("❌ Failed to refresh token:", error);
      
      // If refresh fails, redirect to login
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log("Token refresh failed - redirecting to login");
        window.location.href = "/login";
      }
      
      return false;
    } finally {
      this.refreshInProgress = false;
    }
  }

  /**
   * Manually request token refresh
   */
  public async requestTokenRefresh(): Promise<boolean> {
    return this.refreshTokenViaHttp();
  }

  /**
   * Subscribe to endpoint updates
   */
  subscribeToEndpoint(endpointId: string): void {
    this.subscribedEndpoints.add(endpointId);
    if (this.socket?.connected) {
      console.log(`Subscribing to endpoint: ${endpointId}`);
      this.socket.emit("subscribe-endpoint", endpointId);
    } else {
      console.warn("Cannot subscribe: WebSocket not connected");
    }
  }

  /**
   * Unsubscribe from endpoint updates
   */
  unsubscribeFromEndpoint(endpointId: string): void {
    console.log(`Unsubscribing from endpoint: ${endpointId}`);
    this.subscribedEndpoints.delete(endpointId);
    if (this.socket?.connected) {
      this.socket.emit("unsubscribe-endpoint", endpointId);
    }
  }

  requestInitialData(): void {
    if (this.socket?.connected) {
      console.log("Requesting initial data");
      this.socket.emit("request-initial-data");
    } else {
      console.warn("Cannot request initial data: WebSocket not connected");
    }
  }

  requestEndpointHistory(endpointId: string, limit: number = 50): void {
    if (this.socket?.connected) {
      this.socket.emit("request-endpoint-history", { endpointId, limit });
    }
  }

  on<K extends keyof EventMap>(event: K, callback: EventMap[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const wrappedCallback = (data: EventPayloadMap[K]) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    };
    this.listeners.get(event)!.add(wrappedCallback as EventCallback<K>);
  }

  off<K extends keyof EventMap>(event: K, callback: EventMap[K]): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback as EventCallback<K>);
    }
  }

  removeAllListeners(event?: keyof EventMap): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  private emit<K extends keyof EventMap>(
    event: K,
    data: EventPayloadMap[K],
  ): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => {
        try {
          (callback as (data: EventPayloadMap[K]) => void)(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  disconnect(): void {
    if (this.socket) {
      console.log("🔌 Disconnecting WebSocket");
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscribedEndpoints.clear();
    this.listeners.clear();
    this.connectionPromise = null;
    this.refreshInProgress = false;
  }

  reconnect(): Promise<void> {
    this.disconnect();
    return this.connect();
  }

  getConnectionState(): string {
    return this.socket?.connected ? "connected" : "disconnected";
  }

  getSubscribedEndpoints(): string[] {
    return Array.from(this.subscribedEndpoints);
  }
}

export const wsService = new WebSocketService();
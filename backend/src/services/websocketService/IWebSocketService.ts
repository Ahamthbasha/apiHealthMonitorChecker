export interface IWebSocketService {
  notifyEndpointDeleted(endpointId: string, userId: string): void;

  getConnectedUsersCount(): number;

  getConnectionStats(): {
    totalConnections: number;
    uniqueUsers: number;
    connectionsPerUser: Record<string, number>;
    connections: Array<{
      socketId: string;
      userId: string;
      subscribedEndpoints: string[];
      tokenType?: "access" | "refresh";
      connectedAt?:Date;
    }>;
  };

  refreshUserTokens(userId: string): Promise<boolean>;

  cleanup(): void;
}

export interface ConnectedUser {
  socketId: string;
  userId: string;
  subscribedEndpoints: Set<string>;
  tokenType?: "access" | "refresh";
  connectedAt?:Date
}

export interface LiveMetrics {
  total: number;
  up: number;
  degraded: number;
  down: number;
  avgResponse: number;
  avgUptime: number;
}

export interface EndpointStatus {
  endpointId: string;
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | "inactive";
  lastChecked: Date;
  lastResponseTime: number;
  uptime: number;
  currentFailureCount: number;
  interval: number;
  totalChecks: number;
  isActive: boolean;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

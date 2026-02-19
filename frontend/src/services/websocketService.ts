// src/services/websocketService.ts
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/config';
import type { HealthCheckDTO } from '../types/interface/healthCheckInterface';

export interface HealthCheckData {
  id: string;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string;
}

export interface EndpointStatus {
  endpointId: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded';
  lastChecked: string;
  lastResponseTime: number;
  uptime: number;
  currentFailureCount: number;
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

// Define event payload types
export type EventPayloadMap = {
  'connection-status': ConnectionStatusData;
  'initial-data': InitialData;
  'endpoint-updated': EndpointUpdatedData;
  'threshold-alert': ThresholdAlert;
  'live-stats': LiveStatsData;
  'endpoint-latest-data': EndpointLatestData;
  'endpoint-history': EndpointHistoryData;
  'error': ErrorData;
};

// Define event types with proper interfaces
export type EventMap = {
  [K in keyof EventPayloadMap]: (data: EventPayloadMap[K]) => void;
};

// Type for event listener callbacks
type EventCallback<T extends keyof EventMap> = EventMap[T];

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<keyof EventMap, Set<EventCallback<keyof EventMap>>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionPromise: Promise<void> | null = null;

  /**
   * Connect to WebSocket server - no token needed as it's in cookies
   */
  connect(): Promise<void> {
    // If already connecting, return existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, resolve immediately
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to WebSocket server...', API_BASE_URL);

        // Ensure URL has proper format for WebSocket
        const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
        
        this.socket = io(wsUrl, {
          transports: ['websocket'],
          withCredentials: true, // Important: This sends cookies with the request
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 5000,
          timeout: 10000,
          forceNew: true
        });

        this.setupEventHandlers(resolve, reject);
      } catch (error) {
        this.connectionPromise = null;
        console.error('Failed to create socket connection:', error);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private setupEventHandlers(resolve: () => void, reject: (error: Error) => void): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected with ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.connectionPromise = null;
      this.emit('connection-status', { connected: true });
      resolve();
    });

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection-status', { 
          connected: false, 
          reason: 'Max reconnection attempts reached' 
        });
        reject(new Error('Failed to connect to WebSocket server after multiple attempts'));
        this.connectionPromise = null;
      }
    });

    // Authentication error (401)
    this.socket.on('connect_error', (error: Error) => {
      if (error.message === 'Authentication required' || error.message === 'Invalid token') {
        console.error('❌ WebSocket authentication failed');
        this.emit('connection-status', { 
          connected: false, 
          reason: 'Authentication failed' 
        });
        reject(new Error('Authentication failed'));
        this.connectionPromise = null;
      }
    });

    // Disconnect
    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.emit('connection-status', { connected: false, reason });
      
      if (reason === 'io server disconnect') {
        // Server disconnected, attempt reconnect
        this.socket?.connect();
      }
    });

    // Reconnection attempts
    this.socket.on('reconnect_attempt', (attempt: number) => {
      console.log(`🔄 Reconnection attempt ${attempt}`);
      this.reconnectAttempts = attempt;
    });

    this.socket.on('reconnect', (attempt: number) => {
      console.log(`✅ Reconnected after ${attempt} attempts`);
      this.emit('connection-status', { connected: true });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect after', this.maxReconnectAttempts, 'attempts');
      this.emit('connection-status', { 
        connected: false, 
        reason: 'reconnect_failed' 
      });
    });

    // Handle custom events with proper typing
    this.socket.on('initial-data', (data: InitialData) => {
      console.log('📦 Received initial data with', data.statuses?.length || 0, 'endpoints');
      this.emit('initial-data', data);
    });

    this.socket.on('endpoint-updated', (data: EndpointUpdatedData) => {
      console.log(`🔄 Endpoint ${data.endpointId} updated with status:`, data.check?.status);
      this.emit('endpoint-updated', data);
    });

    this.socket.on('threshold-alert', (alert: ThresholdAlert) => {
      console.warn('⚠️ Threshold alert:', alert);
      this.emit('threshold-alert', alert);
    });

    this.socket.on('live-stats', (data: LiveStatsData) => {
      this.emit('live-stats', data);
    });

    this.socket.on('endpoint-latest-data', (data: EndpointLatestData) => {
      this.emit('endpoint-latest-data', data);
    });

    this.socket.on('endpoint-history', (data: EndpointHistoryData) => {
      this.emit('endpoint-history', data);
    });

    this.socket.on('error', (error: ErrorData) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Subscribe to endpoint updates
   */
  subscribeToEndpoint(endpointId: string): void {
    if (this.socket?.connected) {
      console.log(`📡 Subscribing to endpoint: ${endpointId}`);
      this.socket.emit('subscribe-endpoint', endpointId);
    } else {
      console.warn('Cannot subscribe: WebSocket not connected');
    }
  }

  /**
   * Unsubscribe from endpoint updates
   */
  unsubscribeFromEndpoint(endpointId: string): void {
    if (this.socket?.connected) {
      console.log(`📡 Unsubscribing from endpoint: ${endpointId}`);
      this.socket.emit('unsubscribe-endpoint', endpointId);
    }
  }

  /**
   * Request initial dashboard data
   */
  requestInitialData(): void {
    if (this.socket?.connected) {
      console.log('📡 Requesting initial data');
      this.socket.emit('request-initial-data');
    } else {
      console.warn('Cannot request initial data: WebSocket not connected');
    }
  }

  /**
   * Request endpoint history
   */
  requestEndpointHistory(endpointId: string, limit: number = 50): void {
    if (this.socket?.connected) {
      this.socket.emit('request-endpoint-history', { endpointId, limit });
    }
  }

  /**
   * Register event listener
   */
  on<K extends keyof EventMap>(event: K, callback: EventMap[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof EventMap>(event: K, callback: EventMap[K]): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: keyof EventMap): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Emit event to local listeners - Fixed type safety
   */
  private emit<K extends keyof EventMap>(event: K, data: EventPayloadMap[K]): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          // Type-safe callback execution
          (callback as (data: EventPayloadMap[K]) => void)(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.connectionPromise = null;
  }

  /**
   * Reconnect manually
   */
  reconnect(): Promise<void> {
    this.disconnect();
    return this.connect();
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    return this.socket?.connected ? 'connected' : 'disconnected';
  }
}

// Create singleton instance
export const wsService = new WebSocketService();
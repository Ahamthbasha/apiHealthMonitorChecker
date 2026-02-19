// src/services/websocketService/websocketService.ts
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { IHealthCheckService, ThresholdAlert } from '../userService/userHealthCheckService/IHealthCheckService';
import { IApiEndpointRepository } from '../../repository/userRepo/apiEndpointRepo/IApiEndpointRepo';
import { IHealthCheck } from '../../models/healthCheckModel';
import { IJwtService } from '../jwtService/IJwtService';

interface ConnectedUser {
  socketId: string;
  userId: string;
  subscribedEndpoints: Set<string>;
  tokenType: 'access' | 'refresh';
}

interface LiveMetrics {
  total: number;
  up: number;
  degraded: number;
  down: number;
  avgResponse: number;
  avgUptime: number;
}

interface EndpointStatus {
  endpointId: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded';
  lastChecked: Date;
  lastResponseTime: number;
  uptime: number;
  currentFailureCount: number;
}

interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export class WebSocketService {
  private io: Server;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private healthCheckService: IHealthCheckService;
  private endpointRepository: IApiEndpointRepository;
  private jwtService: IJwtService;
  private broadcastInterval: NodeJS.Timeout | null = null;

  constructor(
    server: HttpServer,
    healthCheckService: IHealthCheckService,
    endpointRepository: IApiEndpointRepository,
    jwtService: IJwtService
  ) {
    this.healthCheckService = healthCheckService;
    this.endpointRepository = endpointRepository;
    this.jwtService = jwtService;
    
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      cookie: true,
      // Add connection timeout
      connectTimeout: 10000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupHealthCheckListeners();
    this.startBroadcastInterval();
  }

  /**
   * Setup authentication middleware with dual token support
   */
  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        // Extract tokens from various sources
        const { accessToken, refreshToken } = this.extractTokens(socket);

        if (!accessToken) {
          console.log('❌ No access token found in handshake');
          return next(new Error('Authentication required'));
        }

        // Try to authenticate with tokens
        const authResult = await this.authenticateWithTokens(accessToken, refreshToken);
        
        if (!authResult.authenticated) {
          return next(new Error(authResult.error || 'Authentication failed'));
        }

        // Set user data in socket
        socket.data.userId = authResult.userId;
        socket.data.tokenType = authResult.tokenType;
        
        // If tokens were refreshed, send them back to client
        if (authResult.newTokens) {
          socket.emit('tokens-refreshed', authResult.newTokens);
        }

        console.log(`✅ User ${authResult.userId} authenticated with ${authResult.tokenType} token`);
        next();
      } catch (error) {
        console.error('❌ Authentication middleware error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Extract tokens from socket handshake
   */
  private extractTokens(socket: Socket): { accessToken: string | null; refreshToken: string | null } {
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    // 1. Check auth object
    if (socket.handshake.auth.token) {
      accessToken = socket.handshake.auth.token;
    }

    // 2. Check cookies
    if (!accessToken && socket.handshake.headers.cookie) {
      const cookies = this.parseCookies(socket.handshake.headers.cookie);
      accessToken = cookies['accessToken'] || null;
      refreshToken = cookies['refreshToken'] || null;
      
      if (Object.keys(cookies).length > 0) {
        console.log('📦 Cookies received:', Object.keys(cookies));
      }
    }

    // 3. Check query parameters (as fallback)
    if (!accessToken && socket.handshake.query.token) {
      accessToken = socket.handshake.query.token as string;
    }

    return { accessToken, refreshToken };
  }

  /**
   * Parse cookie string into object
   */
  private parseCookies(cookieString: string): Record<string, string> {
    return cookieString.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * Authenticate user with access and/or refresh tokens
   */
  private async authenticateWithTokens(
    accessToken: string, 
    refreshToken: string | null
  ): Promise<{
    authenticated: boolean;
    userId?: string;
    tokenType?: 'access' | 'refresh';
    newTokens?: TokenRefreshResponse;
    error?: string;
  }> {
    try {
      // First try to verify with access token
      const decoded = await this.jwtService.verifyAccessToken(accessToken);
      return {
        authenticated: true,
        userId: decoded.userId,
        tokenType: 'access'
      };
    } catch (accessError) {
      console.log('⚠️ Access token verification failed, trying refresh token...');
      
      // If access token is expired but we have refresh token, try refresh
      if (refreshToken) {
        try {
          // Verify refresh token
          const decoded = await this.jwtService.verifyRefreshToken(refreshToken);
          
          // Generate new token pair
          const newTokens = this.jwtService.generateTokenPair({
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
          });
          
          return {
            authenticated: true,
            userId: decoded.userId,
            tokenType: 'refresh',
            newTokens
          };
        } catch (refreshError) {
          console.error('❌ Refresh token verification failed:', refreshError);
          return {
            authenticated: false,
            error: 'Invalid refresh token'
          };
        }
      }
      
      return {
        authenticated: false,
        error: 'Invalid or expired access token'
      };
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      const tokenType = socket.data.tokenType;
      
      console.log(`👤 User ${userId} connected with socket ${socket.id} using ${tokenType} token`);

      // Register user connection
      this.connectedUsers.set(socket.id, {
        socketId: socket.id,
        userId,
        subscribedEndpoints: new Set(),
        tokenType
      });

      // Handle token update from client
      socket.on('update-tokens', (tokens: { accessToken: string; refreshToken: string }) => {
        console.log(`🔄 User ${userId} updated tokens`);
        // You could validate and store these if needed
      });

      // Subscribe to specific endpoint updates
      socket.on('subscribe-endpoint', (endpointId: string) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          user.subscribedEndpoints.add(endpointId);
          console.log(`📡 User ${userId} subscribed to endpoint ${endpointId}`);
          
          // Send latest data for this endpoint immediately
          this.sendEndpointLatestData(socket, endpointId);
        }
      });

      // Unsubscribe from endpoint
      socket.on('unsubscribe-endpoint', (endpointId: string) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          user.subscribedEndpoints.delete(endpointId);
          console.log(`📡 User ${userId} unsubscribed from endpoint ${endpointId}`);
        }
      });

      // Request initial data for dashboard
      socket.on('request-initial-data', async () => {
        await this.sendInitialData(socket, userId);
      });

      // Request endpoint history
      socket.on('request-endpoint-history', async (data: { endpointId: string; limit?: number }) => {
        await this.sendEndpointHistory(socket, userId, data.endpointId, data.limit);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`👋 User ${userId} disconnected. Reason: ${reason}`);
        this.connectedUsers.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`❌ Socket error for user ${userId}:`, error);
      });
    });
  }

  /**
   * Setup health check event listeners
   */
  private setupHealthCheckListeners() {
    // Listen for health check events from monitoring engine
    this.healthCheckService.on('check-completed', (result: IHealthCheck) => {
      this.handleCheckCompleted(result);
    });

    // Listen for threshold alerts
    this.healthCheckService.on('threshold-exceeded', (alert: ThresholdAlert) => {
      this.handleThresholdExceeded(alert);
    });
  }

  /**
   * Start broadcasting live stats periodically
   */
  private startBroadcastInterval() {
    this.broadcastInterval = setInterval(async () => {
      await this.broadcastLiveStats();
    }, 5000);
  }

  /**
   * Handle completed health check
   */
  private async handleCheckCompleted(result: IHealthCheck) {
    try {
      const endpointId = result.endpointId.toString();
      const subscribers = this.findSubscribers(endpointId);
      
      if (subscribers.length > 0) {
        console.log(`📢 Broadcasting update for endpoint ${endpointId} to ${subscribers.length} subscribers`);
      }

      const updateData = {
        endpointId,
        check: {
          id: result._id,
          status: result.status,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          errorMessage: result.errorMessage,
          checkedAt: result.checkedAt
        },
        timestamp: new Date()
      };

      subscribers.forEach(({ socketId }) => {
        this.io.to(socketId).emit('endpoint-updated', updateData);
      });
    } catch (error) {
      console.error('Error handling check completed:', error);
    }
  }

  /**
   * Handle threshold exceeded alert
   */
  private async handleThresholdExceeded(alert: ThresholdAlert) {
    try {
      const endpoint = await this.endpointRepository.findById(alert.endpointId);
      if (!endpoint) return;

      const usersToNotify = this.findUsersByEndpoint(alert.endpointId);
      
      if (usersToNotify.length > 0) {
        console.log(`⚠️ Broadcasting threshold alert for endpoint ${alert.endpointId}`);
      }

      const alertData = {
        ...alert,
        message: `⚠️ ${alert.endpointName} has exceeded failure threshold (${alert.failureCount}/${alert.threshold})`,
        timestamp: new Date()
      };

      usersToNotify.forEach(({ socketId }) => {
        this.io.to(socketId).emit('threshold-alert', alertData);
      });
    } catch (error) {
      console.error('Error handling threshold exceeded:', error);
    }
  }

  /**
   * Send initial dashboard data to newly connected client
   */
  private async sendInitialData(socket: Socket, userId: string) {
    try {
      console.log(`📤 Sending initial data to user ${userId}`);
      
      // Get all endpoints for user
      const endpoints = await this.endpointRepository.findByUser(userId);
      
      // Get latest status for each endpoint
      const statuses = await this.healthCheckService.getUserEndpointsStatus(userId);
      
      // Get recent checks for each endpoint
      const recentChecks: Record<string, any[]> = {};
      await Promise.all(endpoints.map(async (endpoint) => {
        const history = await this.healthCheckService.getEndpointHistory(
          endpoint._id.toString(),
          20
        );
        recentChecks[endpoint._id.toString()] = history;
      }));

      // Calculate summary metrics
      const metrics = this.calculateMetrics(statuses);

      socket.emit('initial-data', {
        endpoints,
        statuses,
        recentChecks,
        metrics,
        timestamp: new Date()
      });

      console.log(`✅ Initial data sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending initial data:', error);
      socket.emit('error', { 
        message: 'Failed to load initial data',
        code: 'INIT_DATA_ERROR'
      });
    }
  }

  /**
   * Send latest data for a specific endpoint
   */
  private async sendEndpointLatestData(socket: Socket, endpointId: string) {
    try {
      const history = await this.healthCheckService.getEndpointHistory(endpointId, 10);
      const stats = await this.healthCheckService.getEndpointStats(endpointId, 24);
      
      socket.emit('endpoint-latest-data', {
        endpointId,
        history,
        stats,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Error sending latest data for endpoint ${endpointId}:`, error);
    }
  }

  /**
   * Send endpoint history to client
   */
  private async sendEndpointHistory(socket: Socket, userId: string, endpointId: string, limit: number = 50) {
    try {
      // Verify endpoint belongs to user
      const endpoint = await this.endpointRepository.findByIdAndUser(endpointId, userId);
      if (!endpoint) {
        socket.emit('error', { 
          message: 'Endpoint not found',
          code: 'ENDPOINT_NOT_FOUND'
        });
        return;
      }

      const history = await this.healthCheckService.getEndpointHistory(endpointId, limit);
      
      socket.emit('endpoint-history', {
        endpointId,
        history,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Error sending history for endpoint ${endpointId}:`, error);
    }
  }

  /**
   * Broadcast live stats to all connected users
   */
  private async broadcastLiveStats() {
    // Group users by userId for efficient querying
    const usersMap = new Map<string, string[]>(); // userId -> socketIds
    
    this.connectedUsers.forEach((user, socketId) => {
      if (!usersMap.has(user.userId)) {
        usersMap.set(user.userId, []);
      }
      usersMap.get(user.userId)!.push(socketId);
    });

    if (usersMap.size === 0) return;

    // For each user, get and broadcast their stats
    const broadcastPromises = Array.from(usersMap.entries()).map(async ([userId, socketIds]) => {
      try {
        const statuses = await this.healthCheckService.getUserEndpointsStatus(userId);
        const metrics = this.calculateMetrics(statuses);
        
        const statsData = {
          statuses,
          metrics,
          timestamp: new Date()
        };

        socketIds.forEach(socketId => {
          this.io.to(socketId).emit('live-stats', statsData);
        });
      } catch (error) {
        console.error(`Error broadcasting stats for user ${userId}:`, error);
      }
    });

    await Promise.allSettled(broadcastPromises);
  }

  /**
   * Calculate live metrics from statuses
   */
  private calculateMetrics(statuses: EndpointStatus[]): LiveMetrics {
    const total = statuses.length;
    const up = statuses.filter(s => s.status === 'up').length;
    const degraded = statuses.filter(s => s.status === 'degraded').length;
    const down = statuses.filter(s => s.status === 'down').length;
    
    const avgResponse = statuses.reduce((acc, s) => acc + s.lastResponseTime, 0) / total || 0;
    const avgUptime = statuses.reduce((acc, s) => acc + s.uptime, 0) / total || 100;

    return {
      total,
      up,
      degraded,
      down,
      avgResponse: Math.round(avgResponse),
      avgUptime: Math.round(avgUptime * 100) / 100
    };
  }

  /**
   * Find users subscribed to a specific endpoint
   */
  private findSubscribers(endpointId: string): Array<{ socketId: string; userId: string }> {
    const subscribers: Array<{ socketId: string; userId: string }> = [];
    
    this.connectedUsers.forEach((user, socketId) => {
      if (user.subscribedEndpoints.has(endpointId)) {
        subscribers.push({ socketId, userId: user.userId });
      }
    });
    
    return subscribers;
  }

  /**
   * Find all users connected
   */
  private findUsersByEndpoint(endpointId: string): Array<{ socketId: string; userId: string }> {
    const users: Array<{ socketId: string; userId: string }> = [];
    
    this.connectedUsers.forEach((user, socketId) => {
      users.push({ socketId, userId: user.userId });
    });
    
    return users;
  }

  /**
   * Get count of connected users
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats() {
    const usersByUserId = new Map<string, number>();
    
    this.connectedUsers.forEach(user => {
      usersByUserId.set(user.userId, (usersByUserId.get(user.userId) || 0) + 1);
    });

    return {
      totalConnections: this.connectedUsers.size,
      uniqueUsers: usersByUserId.size,
      connectionsPerUser: Object.fromEntries(usersByUserId),
      connections: Array.from(this.connectedUsers.entries()).map(([socketId, user]) => ({
        socketId,
        userId: user.userId,
        subscribedEndpoints: Array.from(user.subscribedEndpoints),
        tokenType: user.tokenType
      }))
    };
  }

  /**
   * Refresh tokens for a specific user
   */
  public async refreshUserTokens(userId: string): Promise<boolean> {
    try {
      const userSockets = this.findSocketsByUserId(userId);
      if (userSockets.length === 0) return false;

      // You would typically get user data from database
      // This is a placeholder - implement based on your needs
      const user = await this.endpointRepository.findById(userId);
      if (!user) return false;

      const newTokens = this.jwtService.generateTokenPair({
        userId: user._id.toString(),
        email: '', // You'd need to get email from somewhere
        role: 'user' // Default role
      });

      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('tokens-refreshed', newTokens);
      });

      return true;
    } catch (error) {
      console.error(`Error refreshing tokens for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Find all socket IDs for a user
   */
  private findSocketsByUserId(userId: string): string[] {
    const sockets: string[] = [];
    this.connectedUsers.forEach((user, socketId) => {
      if (user.userId === userId) {
        sockets.push(socketId);
      }
    });
    return sockets;
  }

  /**
   * Clean up resources on shutdown
   */
  public cleanup() {
    console.log('🧹 Cleaning up WebSocket service...');
    
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    
    // Disconnect all sockets
    this.io.disconnectSockets(true);
    this.connectedUsers.clear();
    
    console.log('✅ WebSocket service cleaned up');
  }
}
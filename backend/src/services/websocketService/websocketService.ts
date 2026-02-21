import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { IHealthCheckService } from '../userService/userHealthCheckService/IHealthCheckService';
import { IApiEndpointRepository } from '../../repository/userRepo/apiEndpointRepo/IApiEndpointRepo';
import { IHealthCheck } from '../../models/healthCheckModel';
import { IJwtService } from '../jwtService/IJwtService';
import { HealthCheckDTO } from '../../dto/healthCheckDTO';
import { ConnectedUser, EndpointStatus, IWebSocketService, LiveMetrics, TokenRefreshResponse } from './IWebSocketService';
import { ThresholdAlert } from '../../dto/healthCheckServiceDTO';


export class WebSocketService implements IWebSocketService {
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
      connectTimeout: 10000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupHealthCheckListeners();
    this.startBroadcastInterval();
  }
  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const { accessToken, refreshToken } = this.extractTokens(socket);

        if (!accessToken) {
          console.log('No access token found in handshake');
          return next(new Error('Authentication required'));
        }

        const authResult = await this.authenticateWithTokens(accessToken, refreshToken);
        
        if (!authResult.authenticated) {
          return next(new Error(authResult.error || 'Authentication failed'));
        }

        socket.data.userId = authResult.userId;
        socket.data.tokenType = authResult.tokenType;
        
        if (authResult.newTokens) {
          socket.emit('tokens-refreshed', authResult.newTokens);
        }

        console.log(`User ${authResult.userId} authenticated with ${authResult.tokenType} token`);
        next();
      } catch (error) {
        console.error('Authentication middleware error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  
  private extractTokens(socket: Socket): { accessToken: string | null; refreshToken: string | null } {
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    if (socket.handshake.auth.token) {
      accessToken = socket.handshake.auth.token;
    }

    if (!accessToken && socket.handshake.headers.cookie) {
      const cookies = this.parseCookies(socket.handshake.headers.cookie);
      accessToken = cookies['accessToken'] || null;
      refreshToken = cookies['refreshToken'] || null;
      
      if (Object.keys(cookies).length > 0) {
        console.log('Cookies received:', Object.keys(cookies));
      }
    }

    if (!accessToken && socket.handshake.query.token) {
      accessToken = socket.handshake.query.token as string;
    }

    return { accessToken, refreshToken };
  }
  private parseCookies(cookieString: string): Record<string, string> {
    return cookieString.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

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
      const decoded = await this.jwtService.verifyAccessToken(accessToken);
      return {
        authenticated: true,
        userId: decoded.userId,
        tokenType: 'access'
      };
    } catch (accessError) {
      console.log('Access token verification failed, trying refresh token...');
      
      if (refreshToken) {
        try {
          const decoded = await this.jwtService.verifyRefreshToken(refreshToken);
          
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
          console.error('Refresh token verification failed:', refreshError);
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

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      const tokenType = socket.data.tokenType;
      
      console.log(`User ${userId} connected with socket ${socket.id} using ${tokenType} token`);

      this.connectedUsers.set(socket.id, {
        socketId: socket.id,
        userId,
        subscribedEndpoints: new Set(),
        tokenType
      });

      socket.on('update-tokens', (tokens: { accessToken: string; refreshToken: string }) => {
        console.log(`User ${userId} updated tokens`);
      });

      socket.on('subscribe-endpoint', (endpointId: string) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          user.subscribedEndpoints.add(endpointId);
          console.log(`User ${userId} subscribed to endpoint ${endpointId}`);
          this.sendEndpointLatestData(socket, endpointId);
        }
      });

      socket.on('unsubscribe-endpoint', (endpointId: string) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          user.subscribedEndpoints.delete(endpointId);
          console.log(`User ${userId} unsubscribed from endpoint ${endpointId}`);
        }
      });

      socket.on('request-initial-data', async () => {
        await this.sendInitialData(socket, userId);
      });

      socket.on('request-endpoint-history', async (data: { endpointId: string; limit?: number }) => {
        await this.sendEndpointHistory(socket, userId, data.endpointId, data.limit);
      });

      socket.on('disconnect', (reason) => {
        console.log(`User ${userId} disconnected. Reason: ${reason}`);
        this.connectedUsers.delete(socket.id);
      });

      socket.on('error', (error) => {
        console.error(`Socket error for user ${userId}:`, error);
      });
    });
  }

  private setupHealthCheckListeners() {
    this.healthCheckService.on('check-completed', (result: IHealthCheck) => {
      this.handleCheckCompleted(result);
    });

    this.healthCheckService.on('threshold-exceeded', (alert: ThresholdAlert) => {
      this.handleThresholdExceeded(alert);
    });
  }

  private startBroadcastInterval() {
    this.broadcastInterval = setInterval(async () => {
      await this.broadcastLiveStats();
    }, 5000);
  }

  private async handleCheckCompleted(result: IHealthCheck) {
    try {
      const endpointId = result.endpointId.toString();
      
      const endpoint = await this.endpointRepository.findById(endpointId).catch(() => null);
      
      if (!endpoint) {
        console.log(`Endpoint ${endpointId} no longer exists, skipping broadcast`);
        return;
      }
      
      const subscribers = this.findSubscribers(endpointId);
      
      if (subscribers.length > 0) {
        console.log(`Broadcasting update for endpoint ${endpointId} to ${subscribers.length} subscribers`);
      }
      const checkedAtDate = new Date(result.checkedAt);
    const formattedTime = checkedAtDate.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    
    const formattedDateTime = checkedAtDate.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
      const updateData = {
        endpointId,
        check: {
          id: result._id,
          status: result.status,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          errorMessage: result.errorMessage,
          checkedAt: result.checkedAt,
          formattedTime: formattedTime,
        formattedDateTime: formattedDateTime,
        timestamp: checkedAtDate.getTime()
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

  private async handleThresholdExceeded(alert: ThresholdAlert) {
    try {
      const endpoint = await this.endpointRepository.findById(alert.endpointId);
      if (!endpoint) return;

      const usersToNotify = this.findUsersByEndpoint(alert.endpointId);
      
      if (usersToNotify.length > 0) {
        console.log(`Broadcasting threshold alert for endpoint ${alert.endpointId}`);
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

  private async sendInitialData(socket: Socket, userId: string) {
  try {
    console.log(`Sending initial data to user ${userId}`);
    
    const endpoints = await this.endpointRepository.findByUser(userId);
    const statuses = await this.healthCheckService.getUserEndpointsStatus(userId);
    
    // Add isActive to statuses
    const enrichedStatuses = statuses.map(status => ({
      ...status,
      isActive: endpoints.find(e => e._id.toString() === status.endpointId)?.isActive || false
    }));
    
    const recentChecks: Record<string, HealthCheckDTO[]> = {};
    await Promise.all(endpoints.map(async (endpoint) => {
      const history = await this.healthCheckService.getEndpointHistory(
        endpoint._id.toString(),
        20
      );
      recentChecks[endpoint._id.toString()] = history;
    }));

    const metrics = this.calculateMetrics(enrichedStatuses);

    socket.emit('initial-data', {
      endpoints,
      statuses: enrichedStatuses,
      recentChecks,
      metrics,
      timestamp: new Date()
    });

    console.log(`Initial data sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending initial data:', error);
    socket.emit('error', { 
      message: 'Failed to load initial data',
      code: 'INIT_DATA_ERROR'
    });
  }
}

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

  private async sendEndpointHistory(socket: Socket, userId: string, endpointId: string, limit: number = 50) {
    try {
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

  private async broadcastLiveStats() {
  const usersMap = new Map<string, string[]>(); // userId -> socketIds
  
  this.connectedUsers.forEach((user, socketId) => {
    if (!usersMap.has(user.userId)) {
      usersMap.set(user.userId, []);
    }
    usersMap.get(user.userId)!.push(socketId);
  });

  if (usersMap.size === 0) return;

  const broadcastPromises = Array.from(usersMap.entries()).map(async ([userId, socketIds]) => {
    try {
      const endpoints = await this.endpointRepository.findByUser(userId);
      const statuses = await this.healthCheckService.getUserEndpointsStatus(userId);
      
      // Add isActive to statuses
      const enrichedStatuses = statuses.map(status => ({
        ...status,
        isActive: endpoints.find(e => e._id.toString() === status.endpointId)?.isActive || false
      }));
      
      const metrics = this.calculateMetrics(enrichedStatuses);
      
      const statsData = {
        statuses: enrichedStatuses,
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

  

  private calculateMetrics(statuses: EndpointStatus[]): LiveMetrics {
  const activeStatuses = statuses.filter(s => s.isActive);
  const total = activeStatuses.length;
  const up = activeStatuses.filter(s => s.status === 'up').length;
  const degraded = activeStatuses.filter(s => s.status === 'degraded').length;
  const down = activeStatuses.filter(s => s.status === 'down').length;
  
  const avgResponse = activeStatuses.reduce((acc, s) => acc + s.lastResponseTime, 0) / total || 0;
  const avgUptime = activeStatuses.reduce((acc, s) => acc + s.uptime, 0) / total || 100;

  return {
    total,
    up,
    degraded,
    down,
    avgResponse: Math.round(avgResponse),
    avgUptime: Math.round(avgUptime * 100) / 100
  };
}

  private findSubscribers(endpointId: string): Array<{ socketId: string; userId: string }> {
    const subscribers: Array<{ socketId: string; userId: string }> = [];
    
    this.connectedUsers.forEach((user, socketId) => {
      if (user.subscribedEndpoints.has(endpointId)) {
        subscribers.push({ socketId, userId: user.userId });
      }
    });
    
    return subscribers;
  }

  private findUsersByEndpoint(endpointId: string): Array<{ socketId: string; userId: string }> {
    const users: Array<{ socketId: string; userId: string }> = [];
    
    this.connectedUsers.forEach((user, socketId) => {
      users.push({ socketId, userId: user.userId });
    });
    
    return users;
  }

  private findSocketsByUserId(userId: string): string[] {
    const sockets: string[] = [];
    this.connectedUsers.forEach((user, socketId) => {
      if (user.userId === userId) {
        sockets.push(socketId);
      }
    });
    return sockets;
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

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

  public async refreshUserTokens(userId: string): Promise<boolean> {
    try {
      const userSockets = this.findSocketsByUserId(userId);
      if (userSockets.length === 0) return false;

      const user = await this.endpointRepository.findById(userId);
      if (!user) return false;

      const newTokens = this.jwtService.generateTokenPair({
        userId: user._id.toString(),
        email: '',
        role: 'user'
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

  public notifyEndpointDeleted(endpointId: string, userId: string): void {
    try {
      console.log(`Notifying users about deleted endpoint: ${endpointId}`);
      
      const userSockets = this.findSocketsByUserId(userId);
      
      if (userSockets.length > 0) {
        const deleteData = {
          endpointId,
          timestamp: new Date()
        };
        
        userSockets.forEach(socketId => {
          this.io.to(socketId).emit('endpoint-deleted', deleteData);
        });
        
        console.log(`Sent deletion notification to ${userSockets.length} sockets for user ${userId}`);
      }
      
      this.connectedUsers.forEach((user, socketId) => {
        if (user.userId === userId) {
          user.subscribedEndpoints.delete(endpointId);
        }
      });
      
    } catch (error) {
      console.error('Error notifying endpoint deletion:', error);
    }
  }

  public cleanup() {
    console.log('Cleaning up WebSocket service...');
    
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    
    this.io.disconnectSockets(true);
    this.connectedUsers.clear();
    
    console.log('WebSocket service cleaned up');
  }
}
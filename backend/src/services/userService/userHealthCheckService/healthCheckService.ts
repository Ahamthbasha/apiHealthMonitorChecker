// // src/services/healthCheckService/healthCheckService.ts
// import axios, { AxiosRequestConfig } from 'axios';
// import { IHealthCheckService, EndpointStatus } from './IHealthCheckService';
// import { IHealthCheckRepository } from '../../../repository/userRepo/healthCheckRepo/IHealthCheckRepo'; 
// import { IApiEndpointRepository } from '../../../repository/userRepo/apiEndpointRepo/IApiEndpointRepo';
// import { IHealthCheck } from '../../../models/healthCheckModel';
// import { IApiEndpoint } from '../../../models/apiEndpointModel';
// import { AppError } from '../../../utils/errorUtil/appError';
// import { EventEmitter } from 'events';

// export class HealthCheckService extends EventEmitter implements IHealthCheckService {
//   private monitoringInterval: NodeJS.Timeout | null = null;
//   private isMonitoring: boolean = false;
//   private failureCounts: Map<string, number> = new Map();
//   private checkInProgress: Set<string> = new Set();

//   constructor(
//     private healthCheckRepository: IHealthCheckRepository,
//     private endpointRepository: IApiEndpointRepository
//   ) {
//     super();
//   }

//   /**
//    * Start the monitoring engine
//    */
//   startMonitoring(): void {
//     if (this.isMonitoring) {
//       console.log('Monitoring engine is already running');
//       return;
//     }

//     this.isMonitoring = true;
//     console.log('Starting health monitoring engine...');

//     // Run immediately on start
//     this.runMonitoringCycle();

//     // Schedule regular checks every 30 seconds
//     this.monitoringInterval = setInterval(() => {
//       this.runMonitoringCycle();
//     }, 30000); // Check every 30 seconds for endpoints that need checking
//   }

//   /**
//    * Stop the monitoring engine
//    */
//   stopMonitoring(): void {
//     if (this.monitoringInterval) {
//       clearInterval(this.monitoringInterval);
//       this.monitoringInterval = null;
//     }
//     this.isMonitoring = false;
//     console.log('Health monitoring engine stopped');
//   }

//   /**
//    * Main monitoring cycle - finds endpoints that need checking and checks them
//    */
//   private async runMonitoringCycle(): Promise<void> {
//     try {
//       console.log('Running monitoring cycle...');
      
//       // Find all active endpoints that need to be checked
//       const endpoints = await this.getEndpointsNeedingCheck();
      
//       console.log(`Found ${endpoints.length} endpoints that need checking`);

//       // Check each endpoint (run in parallel but with concurrency limit)
//       const concurrencyLimit = 10;
//       const chunks = this.chunkArray(endpoints, concurrencyLimit);
      
//       for (const chunk of chunks) {
//         await Promise.all(chunk.map(endpoint => this.checkEndpoint(endpoint._id.toString())));
//       }
//     } catch (error) {
//       console.error('Error in monitoring cycle:', error);
//     }
//   }

//   /**
//    * Get all active endpoints that need to be checked based on their interval
//    */
//   async getEndpointsNeedingCheck(): Promise<IApiEndpoint[]> {
//     const activeEndpoints = await this.endpointRepository.findAll({ isActive: true });
    
//     const endpointsNeedingCheck = [];
    
//     for (const endpoint of activeEndpoints) {
//       // Skip if already being checked
//       if (this.checkInProgress.has(endpoint._id.toString())) {
//         continue;
//       }

//       // Get the latest check for this endpoint
//       const latestCheck = await this.healthCheckRepository.findLatestByEndpoint(
//         endpoint._id.toString()
//       );

//       // If never checked, needs check now
//       if (!latestCheck) {
//         endpointsNeedingCheck.push(endpoint);
//         continue;
//       }

//       // Calculate time since last check
//       const timeSinceLastCheck = Date.now() - latestCheck.checkedAt.getTime();
//       const intervalMs = endpoint.interval * 1000;

//       // If enough time has passed, needs check
//       if (timeSinceLastCheck >= intervalMs) {
//         endpointsNeedingCheck.push(endpoint);
//       }
//     }

//     return endpointsNeedingCheck;
//   }

//   /**
//    * Check a single endpoint
//    */
//   async checkEndpoint(endpointId: string): Promise<IHealthCheck> {
//     // Prevent concurrent checks of the same endpoint
//     if (this.checkInProgress.has(endpointId)) {
//       throw new AppError('Check already in progress for this endpoint', 409);
//     }

//     this.checkInProgress.add(endpointId);

//     try {
//       // Get endpoint details
//       const endpoint = await this.endpointRepository.findById(endpointId);
//       if (!endpoint) {
//         throw new AppError('Endpoint not found', 404);
//       }

//       console.log(`Checking endpoint: ${endpoint.name} (${endpoint.url})`);

//       // Prepare request configuration
//       const config: AxiosRequestConfig = {
//         method: endpoint.method,
//         url: endpoint.url,
//         timeout: endpoint.timeout,
//         headers: Object.fromEntries(endpoint.headers || new Map()),
//         validateStatus: () => true // Don't throw on any status code
//       };

//       // Add body for POST/PUT requests
//       if (endpoint.body && ['POST', 'PUT'].includes(endpoint.method)) {
//         config.data = endpoint.body;
        
//         // Set content-type if not already set
//         if (!config.headers?.['Content-Type']) {
//           config.headers = {
//             ...config.headers,
//             'Content-Type': 'application/json'
//           };
//         }
//       }

//       // Perform the check
//       const startTime = Date.now();
//       let response;
      
//       try {
//         response = await axios(config);
//       } catch (error: any) {
//         // Handle network errors or timeouts
//         const healthCheck = await this.saveFailedCheck(
//           endpoint,
//           error.code === 'ECONNABORTED' ? 'timeout' : 'failure',
//           Date.now() - startTime,
//           error.message
//         );
        
//         await this.evaluateEndpointStatus(endpoint, healthCheck);
//         return healthCheck;
//       }

//       const responseTime = Date.now() - startTime;
      
//       // Determine if successful based on expected status
//       const isSuccess = response.status === endpoint.expectedStatus;
      
//       // Save the check result
//       const healthCheck = await this.healthCheckRepository.create({
//         endpointId: endpoint._id,
//         userId: endpoint.userId,
//         status: isSuccess ? 'success' : 'failure',
//         responseTime,
//         statusCode: response.status,
//         checkedAt: new Date(),
//         responseHeaders: new Map(Object.entries(response.headers || {})),
//         responseBody: isSuccess ? undefined : JSON.stringify(response.data).substring(0, 1000) // Limit body size
//       } as IHealthCheck);

//       console.log(`Check completed for ${endpoint.name}: ${isSuccess ? 'SUCCESS' : 'FAILURE'} (${responseTime}ms)`);

//       // Evaluate endpoint status and emit alerts if needed
//       await this.evaluateEndpointStatus(endpoint, healthCheck);

//       return healthCheck;
//     } finally {
//       this.checkInProgress.delete(endpointId);
//     }
//   }

//   /**
//    * Save a failed check result
//    */
//   private async saveFailedCheck(
//     endpoint: IApiEndpoint,
//     status: 'timeout' | 'failure',
//     responseTime: number,
//     errorMessage: string
//   ): Promise<IHealthCheck> {
//     return this.healthCheckRepository.create({
//       endpointId: endpoint._id,
//       userId: endpoint.userId,
//       status,
//       responseTime,
//       errorMessage,
//       checkedAt: new Date()
//     } as IHealthCheck);
//   }

//   /**
//    * Evaluate endpoint status and check thresholds
//    */
//   private async evaluateEndpointStatus(
//     endpoint: IApiEndpoint,
//     healthCheck: IHealthCheck
//   ): Promise<void> {
//     const endpointId = endpoint._id.toString();
    
//     // Update failure count
//     if (healthCheck.status === 'success') {
//       this.failureCounts.delete(endpointId);
//     } else {
//       const currentFailures = this.failureCounts.get(endpointId) || 0;
//       this.failureCounts.set(endpointId, currentFailures + 1);
      
//       // Check if threshold exceeded
//       await this.checkThresholds(endpointId);
//     }
//   }

//   /**
//    * Check if an endpoint has exceeded its failure threshold
//    */
//   async checkThresholds(endpointId: string): Promise<boolean> {
//     const endpoint = await this.endpointRepository.findById(endpointId);
//     if (!endpoint) return false;

//     const failureCount = this.failureCounts.get(endpointId) || 0;
    
//     if (failureCount >= endpoint.thresholds.failureThreshold) {
//       // Emit alert event
//       this.emit('threshold-exceeded', {
//         endpointId,
//         endpointName: endpoint.name,
//         failureCount,
//         threshold: endpoint.thresholds.failureThreshold,
//         timestamp: new Date()
//       });
      
//       console.warn(`ALERT: Endpoint ${endpoint.name} has exceeded failure threshold (${failureCount}/${endpoint.thresholds.failureThreshold})`);
//       return true;
//     }
    
//     return false;
//   }

//   /**
//    * Get check history for an endpoint
//    */
//   async getEndpointHistory(endpointId: string, limit: number = 100): Promise<IHealthCheck[]> {
//     return this.healthCheckRepository.findByEndpoint(endpointId, limit);
//   }

//   /**
//    * Get statistics for an endpoint
//    */
//   async getEndpointStats(endpointId: string, hours: number = 24): Promise<any> {
//     const endpoint = await this.endpointRepository.findById(endpointId);
//     if (!endpoint) {
//       throw new AppError('Endpoint not found', 404);
//     }

//     const stats = await this.healthCheckRepository.getEndpointStats(endpointId, hours);
    
//     return {
//       ...stats,
//       endpointName: endpoint.name,
//       endpointUrl: endpoint.url,
//       period: `${hours} hours`
//     };
//   }

//   /**
//    * Get current status for all of a user's endpoints
//    */
//   async getUserEndpointsStatus(userId: string): Promise<EndpointStatus[]> {
//     const endpoints = await this.endpointRepository.findByUser(userId);
//     const statuses: EndpointStatus[] = [];

//     for (const endpoint of endpoints) {
//       const latestCheck = await this.healthCheckRepository.findLatestByEndpoint(
//         endpoint._id.toString()
//       );
      
//       const stats = await this.healthCheckRepository.getEndpointStats(
//         endpoint._id.toString(),
//         24
//       );

//       const failureCount = this.failureCounts.get(endpoint._id.toString()) || 0;
      
//       let status: 'up' | 'down' | 'degraded' = 'up';
      
//       if (failureCount >= endpoint.thresholds.failureThreshold) {
//         status = 'down';
//       } else if (failureCount > 0) {
//         status = 'degraded';
//       }

//       statuses.push({
//         endpointId: endpoint._id.toString(),
//         name: endpoint.name,
//         url: endpoint.url,
//         status,
//         lastChecked: latestCheck?.checkedAt || new Date(0),
//         lastResponseTime: latestCheck?.responseTime || 0,
//         uptime: stats.uptime,
//         currentFailureCount: failureCount
//       });
//     }

//     return statuses;
//   }

//   /**
//    * Utility: Split array into chunks for concurrency control
//    */
//   private chunkArray<T>(array: T[], chunkSize: number): T[][] {
//     const chunks: T[][] = [];
//     for (let i = 0; i < array.length; i += chunkSize) {
//       chunks.push(array.slice(i, i + chunkSize));
//     }
//     return chunks;
//   }
// }













// src/services/userService/userHealthCheckService/healthCheckService.ts
import axios, { AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';
import { IHealthCheckService, EndpointStatus, ThresholdAlert } from './IHealthCheckService';
import { IHealthCheckRepository } from '../../../repository/userRepo/healthCheckRepo/IHealthCheckRepo'; 
import { IApiEndpointRepository } from '../../../repository/userRepo/apiEndpointRepo/IApiEndpointRepo';
import { IHealthCheck } from '../../../models/healthCheckModel';
import { IApiEndpoint } from '../../../models/apiEndpointModel';
import { AppError } from '../../../utils/errorUtil/appError';

export class HealthCheckService extends EventEmitter implements IHealthCheckService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private failureCounts: Map<string, number> = new Map();
  private checkInProgress: Set<string> = new Set();

  constructor(
    private healthCheckRepository: IHealthCheckRepository,
    private endpointRepository: IApiEndpointRepository
  ) {
    super();
  }

  /**
   * Start the monitoring engine
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('Monitoring engine is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting health monitoring engine...');

    // Run immediately on start
    this.runMonitoringCycle();

    // Schedule regular checks every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.runMonitoringCycle();
    }, 30000); // Check every 30 seconds for endpoints that need checking
  }

  /**
   * Stop the monitoring engine
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Health monitoring engine stopped');
  }

  /**
   * Main monitoring cycle - finds endpoints that need checking and checks them
   */
  private async runMonitoringCycle(): Promise<void> {
    try {
      console.log('Running monitoring cycle...');
      
      // Find all active endpoints that need to be checked
      const endpoints = await this.getEndpointsNeedingCheck();
      
      console.log(`Found ${endpoints.length} endpoints that need checking`);

      // Check each endpoint (run in parallel but with concurrency limit)
      const concurrencyLimit = 10;
      const chunks = this.chunkArray(endpoints, concurrencyLimit);
      
      for (const chunk of chunks) {
        await Promise.all(chunk.map(endpoint => this.checkEndpoint(endpoint._id.toString())));
      }
    } catch (error) {
      console.error('Error in monitoring cycle:', error);
    }
  }

  /**
   * Get all active endpoints that need to be checked based on their interval
   */
  async getEndpointsNeedingCheck(): Promise<IApiEndpoint[]> {
    const activeEndpoints = await this.endpointRepository.findAll({ isActive: true });
    
    const endpointsNeedingCheck = [];
    
    for (const endpoint of activeEndpoints) {
      // Skip if already being checked
      if (this.checkInProgress.has(endpoint._id.toString())) {
        continue;
      }

      // Get the latest check for this endpoint
      const latestCheck = await this.healthCheckRepository.findLatestByEndpoint(
        endpoint._id.toString()
      );

      // If never checked, needs check now
      if (!latestCheck) {
        endpointsNeedingCheck.push(endpoint);
        continue;
      }

      // Calculate time since last check
      const timeSinceLastCheck = Date.now() - latestCheck.checkedAt.getTime();
      const intervalMs = endpoint.interval * 1000;

      // If enough time has passed, needs check
      if (timeSinceLastCheck >= intervalMs) {
        endpointsNeedingCheck.push(endpoint);
      }
    }

    return endpointsNeedingCheck;
  }

  /**
   * Check a single endpoint
   */
  async checkEndpoint(endpointId: string): Promise<IHealthCheck> {
    // Prevent concurrent checks of the same endpoint
    if (this.checkInProgress.has(endpointId)) {
      throw new AppError('Check already in progress for this endpoint', 409);
    }

    this.checkInProgress.add(endpointId);

    try {
      // Get endpoint details
      const endpoint = await this.endpointRepository.findById(endpointId);
      if (!endpoint) {
        throw new AppError('Endpoint not found', 404);
      }

      console.log(`Checking endpoint: ${endpoint.name} (${endpoint.url})`);

      // Prepare request configuration
      const config: AxiosRequestConfig = {
        method: endpoint.method,
        url: endpoint.url,
        timeout: endpoint.timeout,
        headers: Object.fromEntries(endpoint.headers || new Map()),
        validateStatus: () => true // Don't throw on any status code
      };

      // Add body for POST/PUT requests
      if (endpoint.body && ['POST', 'PUT'].includes(endpoint.method)) {
        config.data = endpoint.body;
        
        // Set content-type if not already set
        if (!config.headers?.['Content-Type']) {
          config.headers = {
            ...config.headers,
            'Content-Type': 'application/json'
          };
        }
      }

      // Perform the check
      const startTime = Date.now();
      let response;
      
      try {
        response = await axios(config);
      } catch (error: any) {
        // Handle network errors or timeouts
        const healthCheck = await this.saveFailedCheck(
          endpoint,
          error.code === 'ECONNABORTED' ? 'timeout' : 'failure',
          Date.now() - startTime,
          error.message
        );
        
        await this.evaluateEndpointStatus(endpoint, healthCheck);
        
        // Emit check completed event for failed check
        this.emit('check-completed', healthCheck);
        
        return healthCheck;
      }

      const responseTime = Date.now() - startTime;
      
      // Determine if successful based on expected status
      const isSuccess = response.status === endpoint.expectedStatus;
      
      // Save the check result
      const healthCheck = await this.healthCheckRepository.create({
        endpointId: endpoint._id,
        userId: endpoint.userId,
        status: isSuccess ? 'success' : 'failure',
        responseTime,
        statusCode: response.status,
        checkedAt: new Date(),
        responseHeaders: new Map(Object.entries(response.headers || {})),
        responseBody: isSuccess ? undefined : JSON.stringify(response.data).substring(0, 1000) // Limit body size
      } as IHealthCheck);

      console.log(`Check completed for ${endpoint.name}: ${isSuccess ? 'SUCCESS' : 'FAILURE'} (${responseTime}ms)`);

      // Evaluate endpoint status and emit alerts if needed
      await this.evaluateEndpointStatus(endpoint, healthCheck);
      
      // Emit check completed event
      this.emit('check-completed', healthCheck);

      return healthCheck;
    } finally {
      this.checkInProgress.delete(endpointId);
    }
  }

  /**
   * Save a failed check result
   */
  private async saveFailedCheck(
    endpoint: IApiEndpoint,
    status: 'timeout' | 'failure',
    responseTime: number,
    errorMessage: string
  ): Promise<IHealthCheck> {
    return this.healthCheckRepository.create({
      endpointId: endpoint._id,
      userId: endpoint.userId,
      status,
      responseTime,
      errorMessage,
      checkedAt: new Date()
    } as IHealthCheck);
  }

  /**
   * Evaluate endpoint status and check thresholds
   */
  private async evaluateEndpointStatus(
    endpoint: IApiEndpoint,
    healthCheck: IHealthCheck
  ): Promise<void> {
    const endpointId = endpoint._id.toString();
    
    // Update failure count
    if (healthCheck.status === 'success') {
      this.failureCounts.delete(endpointId);
    } else {
      const currentFailures = this.failureCounts.get(endpointId) || 0;
      this.failureCounts.set(endpointId, currentFailures + 1);
      
      // Check if threshold exceeded
      await this.checkThresholds(endpointId);
    }
  }

  /**
   * Check if an endpoint has exceeded its failure threshold
   */
  async checkThresholds(endpointId: string): Promise<boolean> {
    const endpoint = await this.endpointRepository.findById(endpointId);
    if (!endpoint) return false;

    const failureCount = this.failureCounts.get(endpointId) || 0;
    
    if (failureCount >= endpoint.thresholds.failureThreshold) {
      // Create alert object
      const alert: ThresholdAlert = {
        endpointId,
        endpointName: endpoint.name,
        failureCount,
        threshold: endpoint.thresholds.failureThreshold,
        timestamp: new Date()
      };
      
      // Emit alert event
      this.emit('threshold-exceeded', alert);
      
      console.warn(`ALERT: Endpoint ${endpoint.name} has exceeded failure threshold (${failureCount}/${endpoint.thresholds.failureThreshold})`);
      return true;
    }
    
    return false;
  }

  /**
   * Get check history for an endpoint
   */
  async getEndpointHistory(endpointId: string, limit: number = 100): Promise<IHealthCheck[]> {
    return this.healthCheckRepository.findByEndpoint(endpointId, limit);
  }

  /**
   * Get statistics for an endpoint
   */
  async getEndpointStats(endpointId: string, hours: number = 24): Promise<any> {
    const endpoint = await this.endpointRepository.findById(endpointId);
    if (!endpoint) {
      throw new AppError('Endpoint not found', 404);
    }

    const stats = await this.healthCheckRepository.getEndpointStats(endpointId, hours);
    
    return {
      ...stats,
      endpointName: endpoint.name,
      endpointUrl: endpoint.url,
      period: `${hours} hours`
    };
  }

  /**
   * Get current status for all of a user's endpoints
   */
  async getUserEndpointsStatus(userId: string): Promise<EndpointStatus[]> {
    const endpoints = await this.endpointRepository.findByUser(userId);
    const statuses: EndpointStatus[] = [];

    for (const endpoint of endpoints) {
      const latestCheck = await this.healthCheckRepository.findLatestByEndpoint(
        endpoint._id.toString()
      );
      
      const stats = await this.healthCheckRepository.getEndpointStats(
        endpoint._id.toString(),
        24
      );

      const failureCount = this.failureCounts.get(endpoint._id.toString()) || 0;
      
      let status: 'up' | 'down' | 'degraded' = 'up';
      
      if (failureCount >= endpoint.thresholds.failureThreshold) {
        status = 'down';
      } else if (failureCount > 0) {
        status = 'degraded';
      }

      statuses.push({
        endpointId: endpoint._id.toString(),
        name: endpoint.name,
        url: endpoint.url,
        status,
        lastChecked: latestCheck?.checkedAt || new Date(0),
        lastResponseTime: latestCheck?.responseTime || 0,
        uptime: stats.uptime,
        currentFailureCount: failureCount
      });
    }

    return statuses;
  }

  /**
   * Utility: Split array into chunks for concurrency control
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
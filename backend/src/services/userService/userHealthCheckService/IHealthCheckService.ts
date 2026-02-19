// // src/services/healthCheckService/IHealthCheckService.ts
// import { IHealthCheck } from "../../../models/healthCheckModel";

// export interface EndpointStatus {
//   endpointId: string;
//   name: string;
//   url: string;
//   status: 'up' | 'down' | 'degraded';
//   lastChecked: Date;
//   lastResponseTime: number;
//   uptime: number;
//   currentFailureCount: number;
// }

// export interface IHealthCheckService {
//   // Monitoring methods
//   startMonitoring(): void;
//   stopMonitoring(): void;
//   checkEndpoint(endpointId: string): Promise<IHealthCheck>;
  
//   // Data retrieval methods
//   getEndpointHistory(endpointId: string, limit?: number): Promise<IHealthCheck[]>;
//   getEndpointStats(endpointId: string, hours?: number): Promise<any>;
//   getUserEndpointsStatus(userId: string): Promise<EndpointStatus[]>;
  
//   // Alert methods
//   checkThresholds(endpointId: string): Promise<boolean>;
//   getEndpointsNeedingCheck(): Promise<any[]>;
// }





// src/services/userService/userHealthCheckService/IHealthCheckService.ts
import { IHealthCheck } from "../../../models/healthCheckModel";
import { EventEmitter } from 'events';

export interface EndpointStatus {
  endpointId: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded';
  lastChecked: Date;
  lastResponseTime: number;
  uptime: number;
  currentFailureCount: number;
}

// Define event types
export interface HealthCheckEvents {
  'check-completed': (result: IHealthCheck) => void;
  'threshold-exceeded': (alert: ThresholdAlert) => void;
}

export interface ThresholdAlert {
  endpointId: string;
  endpointName: string;
  failureCount: number;
  threshold: number;
  timestamp: Date;
}

export interface IHealthCheckService {
  // Monitoring methods
  startMonitoring(): void;
  stopMonitoring(): void;
  checkEndpoint(endpointId: string): Promise<IHealthCheck>;
  
  // Data retrieval methods
  getEndpointHistory(endpointId: string, limit?: number): Promise<IHealthCheck[]>;
  getEndpointStats(endpointId: string, hours?: number): Promise<any>;
  getUserEndpointsStatus(userId: string): Promise<EndpointStatus[]>;
  
  // Alert methods
  checkThresholds(endpointId: string): Promise<boolean>;
  getEndpointsNeedingCheck(): Promise<any[]>;
  
  // Event emitter methods
  on<K extends keyof HealthCheckEvents>(event: K, listener: HealthCheckEvents[K]): this;
  emit<K extends keyof HealthCheckEvents>(event: K, ...args: Parameters<HealthCheckEvents[K]>): boolean;
  removeListener<K extends keyof HealthCheckEvents>(event: K, listener: HealthCheckEvents[K]): this;
}
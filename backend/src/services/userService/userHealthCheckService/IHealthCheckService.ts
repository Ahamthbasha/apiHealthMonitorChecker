
import { HealthCheckDTO } from '../../../dto/healthCheckDTO';
import { IHealthCheck } from '../../../models/healthCheckModel';
import { IApiEndpoint } from '../../../models/apiEndpointModel';
import { EndpointStatsResponse, EndpointStatus, HealthCheckEvents, PaginatedHealthChecks } from '../../../dto/healthCheckServiceDTO';

export interface IHealthCheckService {
  startMonitoring(): void;
  stopMonitoring(): void;
  checkEndpoint(endpointId: string): Promise<IHealthCheck>;

  getEndpointHistory(endpointId: string, limit?: number): Promise<HealthCheckDTO[]>;
  getAllHealthChecks(endpointId: string, page?: number, limit?: number, status?: string): Promise<PaginatedHealthChecks>;
  getEndpointStats(endpointId: string, hours?: number): Promise<EndpointStatsResponse>; 
  getUserEndpointsStatus(userId: string): Promise<EndpointStatus[]>;
  getRecentHealthChecks(endpointId: string, limit?: number): Promise<HealthCheckDTO[]>;

  checkThresholds(endpointId: string): Promise<boolean>;
  getEndpointsNeedingCheck(): Promise<IApiEndpoint[]>; 

  on<K extends keyof HealthCheckEvents>(event: K, listener: HealthCheckEvents[K]): this;
  emit<K extends keyof HealthCheckEvents>(event: K, ...args: Parameters<HealthCheckEvents[K]>): boolean;
  removeListener<K extends keyof HealthCheckEvents>(event: K, listener: HealthCheckEvents[K]): this;
}
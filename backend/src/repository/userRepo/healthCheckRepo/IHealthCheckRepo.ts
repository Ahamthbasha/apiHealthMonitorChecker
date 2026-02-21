
import { IGenericRepository } from "../../genericRepo/interface/IGenericRepo";
import { IHealthCheck } from "../../../models/healthCheckModel";
import { LeanHealthCheckDocument } from "../../../types/leanTypes";

export interface IHealthCheckRepository extends IGenericRepository<IHealthCheck> {
  findByEndpoint(endpointId: string, limit?: number, skip?: number): Promise<LeanHealthCheckDocument[]>;
  findLatestByEndpoint(endpointId: string): Promise<IHealthCheck | null>;
  findLatestByUser(userId: string, limit?: number): Promise<IHealthCheck[]>;
  getEndpointStats(endpointId: string, hours?: number): Promise<{
    totalChecks: number;
    successCount: number;
    failureCount: number;
    timeoutCount: number;
    avgResponseTime: number;
    uptime: number;
    latestResponseTime?:number;
    latestStatus?: string;
    latestCheckedAt?: Date;
  }>;
  cleanOldRecords(days?: number): Promise<void>;
  getRecentHealthChecks(endpointId: string, limit?: number): Promise<LeanHealthCheckDocument[]>;
  getAllHealthChecks(endpointId: string, page?: number, limit?: number,status?:string): Promise<{
    data: LeanHealthCheckDocument[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  countByEndpoint(endpointId: string): Promise<number>;
}
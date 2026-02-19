// src/repository/healthCheckRepo/IHealthCheckRepo.ts
import { IGenericRepository } from "../../genericRepo/interface/IGenericRepo";
import { IHealthCheck } from "../../../models/healthCheckModel";
import { LeanHealthCheckDocument } from "../../../types/leanTypes";

export interface IHealthCheckRepository extends IGenericRepository<IHealthCheck> {
  findByEndpoint(endpointId: string, limit?: number): Promise<LeanHealthCheckDocument[]>;
  findLatestByEndpoint(endpointId: string): Promise<IHealthCheck | null>;
  findLatestByUser(userId: string, limit?: number): Promise<IHealthCheck[]>;
  getEndpointStats(endpointId: string, hours?: number): Promise<{
    totalChecks: number;
    successCount: number;
    failureCount: number;
    timeoutCount: number;
    avgResponseTime: number;
    uptime: number;
  }>;
  cleanOldRecords(days?: number): Promise<void>;
}
// src/repository/healthCheckRepo/healthCheckRepo.ts
import { HealthCheck, IHealthCheck } from "../../../models/healthCheckModel";
import { GenericRepository } from "../../genericRepo/genericRepo";
import { IHealthCheckRepository } from "./IHealthCheckRepo";

export class HealthCheckRepository extends GenericRepository<IHealthCheck> implements IHealthCheckRepository {
  constructor() {
    super(HealthCheck);
  }

  async findByEndpoint(endpointId: string, limit: number = 100): Promise<IHealthCheck[]> {
    return this.model
      .find({ endpointId })
      .sort({ checkedAt: -1 })
      .limit(limit)
      .lean();
  }

  async findLatestByEndpoint(endpointId: string): Promise<IHealthCheck | null> {
    return this.model
      .findOne({ endpointId })
      .sort({ checkedAt: -1 })
      .lean();
  }

  async findLatestByUser(userId: string, limit: number = 50): Promise<IHealthCheck[]> {
    return this.model
      .find({ userId })
      .sort({ checkedAt: -1 })
      .limit(limit)
      .populate('endpointId', 'name url')
      .lean();
  }

  async getEndpointStats(endpointId: string, hours: number = 24): Promise<{
    totalChecks: number;
    successCount: number;
    failureCount: number;
    timeoutCount: number;
    avgResponseTime: number;
    uptime: number;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const stats = await this.model.aggregate([
      {
        $match: {
          endpointId: this.toObjectId(endpointId),
          checkedAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: null,
          totalChecks: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
          },
          timeoutCount: {
            $sum: { $cond: [{ $eq: ['$status', 'timeout'] }, 1, 0] }
          },
          totalResponseTime: { $sum: '$responseTime' },
          successfulChecks: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          totalChecks: 1,
          successCount: 1,
          failureCount: 1,
          timeoutCount: 1,
          avgResponseTime: {
            $cond: [
              { $eq: ['$totalChecks', 0] },
              0,
              { $divide: ['$totalResponseTime', '$totalChecks'] }
            ]
          },
          uptime: {
            $cond: [
              { $eq: ['$totalChecks', 0] },
              100,
              { $multiply: [{ $divide: ['$successfulChecks', '$totalChecks'] }, 100] }
            ]
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalChecks: 0,
        successCount: 0,
        failureCount: 0,
        timeoutCount: 0,
        avgResponseTime: 0,
        uptime: 100 // Assume 100% uptime if no checks
      };
    }

    return stats[0];
  }

  async cleanOldRecords(days: number = 30): Promise<void> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    await this.model.deleteMany({ checkedAt: { $lt: cutoffDate } });
  }

  private toObjectId(id: string): any {
    return new this.model.base.Types.ObjectId(id);
  }
}
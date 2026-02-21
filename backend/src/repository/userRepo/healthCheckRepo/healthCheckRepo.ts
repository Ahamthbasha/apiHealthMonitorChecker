import { Types } from 'mongoose';
import { HealthCheck, IHealthCheck } from '../../../models/healthCheckModel';
import { LeanHealthCheckDocument } from '../../../types/leanTypes';
import { GenericRepository } from '../../genericRepo/genericRepo';
import { IHealthCheckRepository } from './IHealthCheckRepo';
import { EndpointStatsResult, HealthCheckQuery } from '../../../dto/healthCheckDTO';



export class HealthCheckRepository
  extends GenericRepository<IHealthCheck>
  implements IHealthCheckRepository
{
  constructor() {
    super(HealthCheck);
  }

  async findByEndpoint(
    endpointId: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<LeanHealthCheckDocument[]> {
    return this.model
      .find({ endpointId })
      .sort({ checkedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('endpointId', 'name url method')
      .lean() as unknown as LeanHealthCheckDocument[];
  }

  async findLatestByEndpoint(endpointId: string): Promise<IHealthCheck | null> {
    return this.model
      .findOne({ endpointId })
      .sort({ checkedAt: -1 })
      .populate('endpointId', 'name url')
      .lean() as unknown as IHealthCheck | null;
  }

  async findLatestByUser(userId: string, limit: number = 50): Promise<IHealthCheck[]> {
    return this.model
      .find({ userId })
      .sort({ checkedAt: -1 })
      .limit(limit)
      .populate('endpointId', 'name url')
      .lean() as unknown as IHealthCheck[];
  }

  async getEndpointStats(
    endpointId: string,
    hours: number = 24
  ): Promise<{
    totalChecks: number;
    successCount: number;
    failureCount: number;
    timeoutCount: number;
    avgResponseTime: number;
    uptime: number;
    latestResponseTime?: number;
    latestStatus?: string;
    latestCheckedAt?: Date;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const latestCheck = await this.model
      .findOne({ endpointId })
      .sort({ checkedAt: -1 })
      .lean();

    const stats = await this.model.aggregate<EndpointStatsResult>([
      {
        $match: {
          endpointId: this.toObjectId(endpointId),
          checkedAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: null,
          totalChecks: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] },
          },
          timeoutCount: {
            $sum: { $cond: [{ $eq: ['$status', 'timeout'] }, 1, 0] },
          },
          totalResponseTime: { $sum: '$responseTime' },
          successfulChecks: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
        },
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
              { $divide: ['$totalResponseTime', '$totalChecks'] },
            ],
          },
          uptime: {
            $cond: [
              { $eq: ['$totalChecks', 0] },
              100,
              { $multiply: [{ $divide: ['$successfulChecks', '$totalChecks'] }, 100] },
            ],
          },
        },
      },
    ]);

    const latestFields = {
      latestResponseTime: latestCheck?.responseTime ?? 0,
      latestStatus: latestCheck?.status ?? 'unknown',
      latestCheckedAt: latestCheck?.checkedAt,
    };

    if (stats.length === 0) {
      return {
        totalChecks: 0,
        successCount: 0,
        failureCount: 0,
        timeoutCount: 0,
        avgResponseTime: 0,
        uptime: 100,
        ...latestFields,
      };
    }

    return {
      ...stats[0],
      ...latestFields,
    };
  }

  async cleanOldRecords(days: number = 30): Promise<void> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    await this.model.deleteMany({ checkedAt: { $lt: cutoffDate } });
  }

  async getRecentHealthChecks(
    endpointId: string,
    limit: number = 10
  ): Promise<LeanHealthCheckDocument[]> {
    return this.model
      .find({ endpointId })
      .sort({ checkedAt: -1 })
      .limit(limit)
      .populate('endpointId', 'name url method')
      .lean() as unknown as LeanHealthCheckDocument[];
  }

  async getAllHealthChecks(
    endpointId: string,
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{
    data: LeanHealthCheckDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const query: HealthCheckQuery = { endpointId };

    if (status && status !== 'all') {
      query.status = status;
    }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ checkedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as unknown as Promise<LeanHealthCheckDocument[]>,
      this.model.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async countByEndpoint(endpointId: string): Promise<number> {
    return this.model.countDocuments({ endpointId });
  }

  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }
}
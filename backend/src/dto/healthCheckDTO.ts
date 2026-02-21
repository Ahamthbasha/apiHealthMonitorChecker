
import { Types } from 'mongoose';
import { LeanHealthCheckDocument } from '../types/leanTypes';

export interface HealthCheckDTO {
  id: string;
  endpointId: string;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string;
  timestamp: number;
  formattedTime: string;
  formattedDateTime: string;
}

export class HealthCheckMapper {
  static formatToChartTime(date: Date): string {
    return date.toLocaleString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  static formatToIndianTime(date: Date): string {
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  static formatToFullDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  static fromLeanDocument(leanDoc: LeanHealthCheckDocument): HealthCheckDTO {
    return {
      id: leanDoc._id.toString(),
      endpointId: leanDoc.endpointId.toString(),
      status: leanDoc.status,
      responseTime: leanDoc.responseTime,
      statusCode: leanDoc.statusCode,
      errorMessage: leanDoc.errorMessage,
      checkedAt: this.formatToIndianTime(leanDoc.checkedAt),
      timestamp: leanDoc.checkedAt.getTime(),
      formattedTime: this.formatToChartTime(leanDoc.checkedAt),
      formattedDateTime: this.formatToFullDateTime(leanDoc.checkedAt)
    };
  }

  static fromLeanDocumentList(leanDocs: LeanHealthCheckDocument[]): HealthCheckDTO[] {
    return leanDocs
      .map(doc => this.fromLeanDocument(doc))
      .sort((a, b) => a.timestamp - b.timestamp); // Ascending order for charts
  }


  static fromLeanDocumentListDescending(leanDocs: LeanHealthCheckDocument[]): HealthCheckDTO[] {
  return leanDocs
    .map(doc => this.fromLeanDocument(doc))
  }

  static fromLeanDocumentListHealthCheckTable(leanDocs: LeanHealthCheckDocument[]): HealthCheckDTO[] {
  return leanDocs
    .map(doc => this.fromLeanDocument(doc))
    .sort((a, b) => b.timestamp - a.timestamp);
  }
}

export interface HealthCheckQuery {
  endpointId: string;
  status?: string;
}

export interface EndpointStatsResult {
  totalChecks: number;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  avgResponseTime: number;
  uptime: number;
}
// src/dtos/healthCheckDTO.ts
import { Types } from 'mongoose';
import { LeanHealthCheckDocument } from '../types/leanTypes';

export interface HealthCheckDTO {
  id: string;
  endpointId: string;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string; // Formatted date string
}

export class HealthCheckMapper {
  /**
   * Format date to Indian time (IST) in 12-hour format
   */
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

  /**
   * Map a lean MongoDB document to HealthCheckDTO
   */
  static fromLeanDocument(leanDoc: LeanHealthCheckDocument): HealthCheckDTO {
    return {
      id: leanDoc._id.toString(),
      endpointId: leanDoc.endpointId.toString(),
      status: leanDoc.status,
      responseTime: leanDoc.responseTime,
      statusCode: leanDoc.statusCode,
      errorMessage: leanDoc.errorMessage,
      checkedAt: this.formatToIndianTime(leanDoc.checkedAt)
    };
  }

  /**
   * Map an array of lean MongoDB documents to HealthCheckDTO array
   */
  static fromLeanDocumentList(leanDocs: LeanHealthCheckDocument[]): HealthCheckDTO[] {
    return leanDocs.map(doc => this.fromLeanDocument(doc));
  }
}

import { Types } from 'mongoose';

export type LeanHealthCheckDocument = {
  _id: Types.ObjectId;
  endpointId: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: Date;
  responseHeaders?: Map<string, string>;
  responseBody?: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}
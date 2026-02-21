
import mongoose, { Document, Schema } from 'mongoose';

export interface IHealthCheckData {
  endpointId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: Date;
  responseHeaders?: Map<string, string>;
  responseBody?: string;
}

export interface IHealthCheck extends Document, IHealthCheckData {}

const healthCheckSchema = new Schema<IHealthCheck>({
  endpointId: { 
    type: Schema.Types.ObjectId, 
    ref: 'ApiEndpoint', 
    required: true,
    index: true 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: ['success', 'failure', 'timeout'],
    required: true,
    index: true 
  },
  responseTime: { 
    type: Number, 
    required: true,
    min: 0 
  },
  statusCode: { 
    type: Number,
    min: 100,
    max: 599 
  },
  errorMessage: { 
    type: String,
    trim: true 
  },
  checkedAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  responseHeaders: { 
    type: Map, 
    of: String,
    default: {}
  },
  responseBody: { 
    type: String,
    default: null
  }
}, {
  timestamps: true
});

healthCheckSchema.index({ endpointId: 1, checkedAt: -1 });
healthCheckSchema.index({ userId: 1, checkedAt: -1 });
healthCheckSchema.index({ status: 1, checkedAt: -1 });
healthCheckSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const HealthCheck = mongoose.model<IHealthCheck>('HealthCheck', healthCheckSchema);
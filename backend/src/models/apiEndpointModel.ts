import mongoose, { Document, Schema } from 'mongoose';

export interface IApiEndpointData {
  userId: mongoose.Types.ObjectId | string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Map<string, string>;
  body?: string;
  expectedStatus: number;
  interval: 60 | 300 | 900;
  timeout: number;
  isActive: boolean;
  thresholds: {
    maxResponseTime: number;
    failureThreshold: number;
  };
}

export interface IApiEndpoint extends Document, IApiEndpointData {
  createdAt: Date;
  updatedAt: Date;
}

const apiEndpointSchema = new Schema<IApiEndpoint>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  url: { 
    type: String, 
    required: true,
    trim: true 
  },
  method: { 
    type: String, 
    enum: ['GET', 'POST', 'PUT', 'DELETE'],
    default: 'GET'
  },
  headers: { 
    type: Map, 
    of: String, 
    default: {} 
  },
  body: { 
    type: String,
    default: null
  },
  expectedStatus: { 
    type: Number, 
    default: 200 
  },
  interval: { 
    type: Number, 
    enum: [60, 300, 900],
    default: 300 
  },
  timeout: {
    type: Number,
    default: 10000
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  thresholds: {
    maxResponseTime: { type: Number, default: 5000 },
    failureThreshold: { type: Number, default: 3 }
  }
}, {
  timestamps: true
});

apiEndpointSchema.index({ userId: 1, createdAt: -1 });

export const ApiEndpoint = mongoose.model<IApiEndpoint>('ApiEndpoint', apiEndpointSchema);
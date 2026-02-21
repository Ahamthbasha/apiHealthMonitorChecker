import { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../../models/userModel';

export const mockUserId = new Types.ObjectId().toString();
export const mockEndpointId = new Types.ObjectId().toString();

export interface MockUrls {
  valid: string[];
  invalid: string[];
  timeout: string[];
  serverErrors: string[];
}

export const mockUrls: MockUrls = {
  valid: [
    'https://api.example.com',
    'http://localhost:3000',
    'https://sub.domain.com/path?query=1',
    'http://192.168.1.1:8080/api',
  ],
  invalid: [
    'not-a-url',
    'http://',
    'https://',
    'ftp://example.com',
    'http://.com',
    'http://invalid',
    'localhost:3000',
    'http://example.com:99999',
    'http://[::1]:port',
    'http://example.com/%%20invalid%%20encoding',
  ],
  timeout: [
    'https://httpbin.org/delay/5',
    'https://httpbin.org/delay/10',
  ],
  serverErrors: [
    'https://httpbin.org/status/500',
    'https://httpbin.org/status/502',
    'https://httpbin.org/status/503',
    'https://httpbin.org/status/504',
  ],
};

export interface MockEndpointThresholds {
  maxResponseTime: number;
  failureThreshold: number;
}

export interface MockEndpoint {
  _id: Types.ObjectId | string;
  userId: string;
  name: string;
  url: string;
  method: string;
  headers: Map<string, string>;
  body: null | string;
  expectedStatus: number;
  interval: number;
  timeout: number;
  isActive: boolean;
  thresholds: MockEndpointThresholds;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockEndpointOverrides {
  _id?: Types.ObjectId | string;
  userId?: string;
  name?: string;
  url?: string;
  method?: string;
  headers?: Map<string, string>;
  body?: null | string;
  expectedStatus?: number;
  interval?: number;
  timeout?: number;
  isActive?: boolean;
  thresholds?: MockEndpointThresholds;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createMockEndpoint = (overrides: MockEndpointOverrides = {}): MockEndpoint => ({
  _id: new Types.ObjectId(),
  userId: mockUserId,
  name: 'Test API Endpoint',
  url: 'https://api.example.com/test',
  method: 'GET',
  headers: new Map(),
  body: null,
  expectedStatus: 200,
  interval: 300,
  timeout: 5000,
  isActive: true,
  thresholds: {
    maxResponseTime: 5000,
    failureThreshold: 3,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export type HealthCheckStatus = 'success' | 'failure' | 'timeout';

export interface MockHealthCheck {
  _id: Types.ObjectId;
  endpointId: string;
  userId: string;
  status: HealthCheckStatus;
  responseTime: number;
  statusCode: number;
  errorMessage: null | string;
  checkedAt: Date;
  responseHeaders: Map<string, string>;
  responseBody: null | string;
}

export interface MockHealthCheckOverrides {
  status?: HealthCheckStatus;
  responseTime?: number;
  statusCode?: number;
  errorMessage?: null | string;
  checkedAt?: Date;
  responseHeaders?: Map<string, string>;
  responseBody?: null | string;
}

export const createMockHealthCheck = (
  endpointId: string,
  overrides: MockHealthCheckOverrides = {}
): MockHealthCheck => ({
  _id: new Types.ObjectId(),
  endpointId,
  userId: mockUserId,
  status: 'success',
  responseTime: 250,
  statusCode: 200,
  errorMessage: null,
  checkedAt: new Date(),
  responseHeaders: new Map([['content-type', 'application/json']]),
  responseBody: null,
  ...overrides,
});

export const createTestUser = async () => {
  const user = await User.create({
    _id: mockUserId,
    name: 'Test User',
    email: 'test@example.com',
    password: await bcrypt.hash('Password123!', 10),
    role: 'user',
    isActive: true,
  });
  return user;
};

export const getAuthCookieHeader = (accessToken: string, refreshToken: string): string[] => {
  return [
    `accessToken=${accessToken}`,
    `refreshToken=${refreshToken}`,
  ];
};

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Server } from 'http';
import app from '../app';
import jwt from 'jsonwebtoken';
import request from 'supertest';

let mongoServer: MongoMemoryServer;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let testServer: Server;

declare global {
  // eslint-disable-next-line no-var
  var __TEST_COOKIES__: string[] | undefined;
  // eslint-disable-next-line no-var
  var generateAuthCookie: (userId: string) => Promise<string[]>;
  // eslint-disable-next-line no-var
  var getAuthCookies: (response: request.Response) => Record<string, string>;
  // eslint-disable-next-line no-var
  var generateAuthToken: (userId: string) => string;
}

global.getAuthCookies = (response: request.Response): Record<string, string> => {
  const cookies: Record<string, string> = {};
  const setCookieHeader = response.headers['set-cookie'] as string | string[] | undefined;

  if (setCookieHeader) {
    const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    cookieArray.forEach((cookie: string) => {
      const [cookiePair] = cookie.split(';');
      const [key, value] = cookiePair.split('=');
      if (key !== undefined && value !== undefined) {
        cookies[key.trim()] = value.trim();
      }
    });
  }

  return cookies;
};

global.generateAuthCookie = async (userId: string): Promise<string[]> => {
  const accessToken = jwt.sign(
    { userId, email: 'test@example.com', role: 'user' },
    process.env.JWT_SECRET ?? 'test-secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, email: 'test@example.com', role: 'user' },
    process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret',
    { expiresIn: '7d' }
  );

  return [
    `accessToken=${accessToken}`,
    `refreshToken=${refreshToken}`,
  ];
};

global.generateAuthToken = (userId: string): string => {
  return jwt.sign(
    { userId, email: 'test@example.com', role: 'user' },
    process.env.JWT_SECRET ?? 'test-secret',
    { expiresIn: '15m' }
  );
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_REGISTRATION_SECRET = 'test-registration-secret';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.BCRYPT_SALT_ROUNDS = '10';
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_EXPIRY = '15m';
  process.env.JWT_REFRESH_EXPIRY = '7d';
  process.env.JWT_REGISTRATION_EXPIRY = '10m';
  process.env.GMAIL_USER = 'test@gmail.com';
  process.env.GMAIL_APP_PASSWORD = 'test-password';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  global.__TEST_COOKIES__ = undefined;
});

jest.mock('../services/emailService/emailService', () => {
  return {
    EmailService: jest.fn().mockImplementation(() => ({
      sendOTPEmail: jest.fn().mockResolvedValue({ success: true }),
      sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
      verifyConnection: jest.fn().mockResolvedValue(undefined),
    })),
  };
});
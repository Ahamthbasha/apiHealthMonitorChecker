process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_REGISTRATION_SECRET = 'test-registration-secret';
process.env.BCRYPT_SALT_ROUNDS = '10';
process.env.JWT_SECRET = 'test-secret';

import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthMiddleware } from '../../middlewares/authMiddleware';
import { AppError } from '../../utils/errorUtil/appError';
import { mockUserId } from '../factories/mockData';
import { IJwtService } from '../../services/jwtService/IJwtService';
import { IUserRepository } from '../../repository/userRepo/userAuthRepo/IuserAuthRepo';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { IUser, UserRole } from '../../models/userModel';

const createMockUser = (id: string, isActive: boolean = true): IUser => {
  const objectId = new Types.ObjectId(id);

  return {
    _id: objectId,
    id: objectId.toHexString(),
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: UserRole.USER,
    isActive,
    createdAt: new Date(),
    updatedAt: new Date(),
    $assertPopulated: jest.fn(),
    $clearModifiedPaths: jest.fn(),
    $clone: jest.fn(),
    $createModifiedPathsSnapshot: jest.fn(),
    $getAllSubdocs: jest.fn(),
    $getPopulatedDocs: jest.fn(),
    $ignore: jest.fn(),
    $isDefault: jest.fn(),
    $isDeleted: jest.fn(),
    $isEmpty: jest.fn(),
    $isValid: jest.fn(),
    $locals: {},
    $markValid: jest.fn(),
    $model: jest.fn(),
    $op: null,
    $restoreModifiedPathsSnapshot: jest.fn(),
    $session: jest.fn(),
    $set: jest.fn(),
    $where: {},
    baseModelName: undefined,
    collection: {} as IUser['collection'],
    db: {} as IUser['db'],
    delete: jest.fn(),
    deleteOne: jest.fn(),
    depopulate: jest.fn(),
    directModifiedPaths: jest.fn(),
    equals: jest.fn(),
    errors: undefined,
    get: jest.fn(),
    getChanges: jest.fn(),
    increment: jest.fn(),
    init: jest.fn(),
    inspect: jest.fn(),
    invalidate: jest.fn(),
    isDirectModified: jest.fn(),
    isDirectSelected: jest.fn(),
    isInit: jest.fn(),
    isModified: jest.fn(),
    isNew: false,
    isSelected: jest.fn(),
    markModified: jest.fn(),
    model: jest.fn(),
    modelName: 'User',
    modifiedPaths: jest.fn(),
    overwrite: jest.fn(),
    populate: jest.fn(),
    populated: jest.fn(),
    replaceOne: jest.fn(),
    save: jest.fn(),
    schema: {} as IUser['schema'],
    set: jest.fn(),
    toJSON: jest.fn(),
    toObject: jest.fn(),
    toString: jest.fn(),
    unmarkModified: jest.fn(),
    update: jest.fn(),
    updateOne: jest.fn(),
    validate: jest.fn(),
    validateSync: jest.fn(),
  } as unknown as IUser;
};

const mockJwtService: jest.Mocked<IJwtService> = {
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  generateTokenPair: jest.fn(),
  generateRegistrationToken: jest.fn(),
  verifyRegistrationToken: jest.fn(),
};

const mockUserRepository: jest.Mocked<Pick<IUserRepository, 'findById'>> = {
  findById: jest.fn(),
};

const authMiddleware = new AuthMiddleware(
  mockJwtService,
  mockUserRepository as unknown as IUserRepository
);

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      cookies: {},
    };
    mockResponse = {
      clearCookie: jest.fn(),
      cookie: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should authenticate valid token', async () => {
    const mockPayload = {
      userId: mockUserId,
      email: 'test@example.com',
      role: 'user',
    };

    mockRequest.cookies = { accessToken: 'valid-token' };

    mockJwtService.verifyAccessToken.mockReturnValue(mockPayload);
    mockUserRepository.findById.mockResolvedValue(createMockUser(mockUserId, true));

    await authMiddleware.authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockJwtService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
    expect((mockRequest as AuthRequest).user).toBeDefined();
    expect((mockRequest as AuthRequest).user?.userId).toBe(mockUserId);
    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should authenticate with refresh token when access token is invalid', async () => {
    const mockPayload = {
      userId: mockUserId,
      email: 'test@example.com',
      role: 'user',
    };

    mockRequest.cookies = {
      accessToken: 'invalid-token',
      refreshToken: 'valid-refresh-token',
    };

    mockJwtService.verifyAccessToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    mockJwtService.verifyRefreshToken.mockReturnValue(mockPayload);
    mockUserRepository.findById.mockResolvedValue(createMockUser(mockUserId, true));
    mockJwtService.generateAccessToken.mockReturnValue('new-access-token');

    await authMiddleware.authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockJwtService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
    expect(mockJwtService.generateAccessToken).toHaveBeenCalled();
    expect(mockResponse.cookie).toHaveBeenCalled();
    expect((mockRequest as AuthRequest).user).toBeDefined();
    expect((mockRequest as AuthRequest).user?.userId).toBe(mockUserId);
    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should reject missing token', async () => {
    await authMiddleware.authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));

    const error: unknown = nextFunction.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    if (error instanceof AppError) {
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('No authentication tokens provided');
    }
  });

  it('should reject invalid token', async () => {
    mockRequest.cookies = { accessToken: 'invalid-token' };

    mockJwtService.verifyAccessToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authMiddleware.authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));

    const error: unknown = nextFunction.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    if (error instanceof AppError) {
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication required');
    }
  });

  it('should reject when user is inactive', async () => {
    const mockPayload = {
      userId: mockUserId,
      email: 'test@example.com',
      role: 'user',
    };

    mockRequest.cookies = { accessToken: 'valid-token' };

    mockJwtService.verifyAccessToken.mockReturnValue(mockPayload);
    mockUserRepository.findById.mockResolvedValue(createMockUser(mockUserId, false));

    await authMiddleware.authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));

    const error: unknown = nextFunction.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    if (error instanceof AppError) {
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication required');
    }
  });

  it('should reject when both tokens are invalid', async () => {
    mockRequest.cookies = {
      accessToken: 'invalid-token',
      refreshToken: 'invalid-refresh-token',
    };

    mockJwtService.verifyAccessToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    mockJwtService.verifyRefreshToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authMiddleware.authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));

    const error: unknown = nextFunction.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    if (error instanceof AppError) {
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Session expired. Please login again.');
    }
  });

  it('should handle case when refresh token is valid but user is inactive', async () => {
    const mockPayload = {
      userId: mockUserId,
      email: 'test@example.com',
      role: 'user',
    };

    mockRequest.cookies = {
      accessToken: 'invalid-token',
      refreshToken: 'valid-refresh-token',
    };

    mockJwtService.verifyAccessToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    mockJwtService.verifyRefreshToken.mockReturnValue(mockPayload);
    mockUserRepository.findById.mockResolvedValue(createMockUser(mockUserId, false));

    await authMiddleware.authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));

    const error: unknown = nextFunction.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    if (error instanceof AppError) {
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Session expired. Please login again.');
    }
  });

  it('should handle case when only refresh token is provided and valid', async () => {
    const mockPayload = {
      userId: mockUserId,
      email: 'test@example.com',
      role: 'user',
    };

    mockRequest.cookies = { refreshToken: 'valid-refresh-token' };

    mockJwtService.verifyRefreshToken.mockReturnValue(mockPayload);
    mockUserRepository.findById.mockResolvedValue(createMockUser(mockUserId, true));
    mockJwtService.generateAccessToken.mockReturnValue('new-access-token');

    await authMiddleware.authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockJwtService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
    expect(mockJwtService.generateAccessToken).toHaveBeenCalled();
    expect(mockResponse.cookie).toHaveBeenCalled();
    expect((mockRequest as AuthRequest).user).toBeDefined();
    expect((mockRequest as AuthRequest).user?.userId).toBe(mockUserId);
    expect(nextFunction).toHaveBeenCalledWith();
  });
});
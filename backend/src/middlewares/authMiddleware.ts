import { Request, Response, NextFunction } from 'express';
import { IJwtService } from '../services/jwtService/IJwtService';
import { IUserRepository } from '../repository/userRepo/userAuthRepo/IuserAuthRepo'; 
import { AppError } from '../utils/errorUtil/appError';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface IAuthMiddleware {
  authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}

export class AuthMiddleware implements IAuthMiddleware {
  constructor(
    private jwtService: IJwtService,
    private userRepository: IUserRepository
  ) {}

  authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    // No tokens at all - reject immediately
    if (!accessToken && !refreshToken) {
      throw new AppError('No authentication tokens provided', 401);
    }

    // Try access token first
    if (accessToken) {
      try {
        const payload = this.jwtService.verifyAccessToken(accessToken);
        const user = await this.userRepository.findById(payload.userId);
        
        if (!user || !user.isActive) {
          throw new AppError('User not found or inactive', 401);
        }

        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        };
        
        return next(); // Access token valid - continue
        
      } catch (accessTokenError) {
        // Access token invalid/expired - continue to refresh token logic below
        // DO NOT throw here - we have a refresh token to try
      }
    }

    // If we reach here, access token is missing/invalid - try refresh token
    if (refreshToken) {
      try {
        const refreshPayload = this.jwtService.verifyRefreshToken(refreshToken);
        const user = await this.userRepository.findById(refreshPayload.userId);
        
        if (!user || !user.isActive) {
          // Clear cookies and reject
          res.clearCookie('refreshToken');
          res.clearCookie('accessToken');
          throw new AppError('User not found or inactive', 401);
        }

        // Generate new access token
        const newAccessToken = this.jwtService.generateAccessToken({
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        });

        // Set new access token cookie
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000, // 2 minutes
        });

        // Attach user to request
        req.user = {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        };

        return next(); // Continue with new access token
        
      } catch (refreshTokenError) {
        // Both tokens invalid - clear and reject
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');
        throw new AppError('Session expired. Please login again.', 401);
      }
    }

    // No valid tokens found
    throw new AppError('Authentication required', 401);
    
  } catch (error) {
    next(error);
  }
};
}
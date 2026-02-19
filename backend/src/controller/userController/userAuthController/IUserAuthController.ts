import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/authMiddleware';

export interface IAuthController {
  register(req: Request, res: Response, next: NextFunction): Promise<void>;
  verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
  resendOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
  login(req: Request, res: Response, next: NextFunction): Promise<void>;
  logout(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
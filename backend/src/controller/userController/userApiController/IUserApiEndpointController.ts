
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/authMiddleware';

export interface IApiEndpointController {
  createEndpoint(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
  getUserEndpoints(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
  getEndpointById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
  updateEndpoint(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
  deleteEndpoint(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
  toggleEndpoint(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
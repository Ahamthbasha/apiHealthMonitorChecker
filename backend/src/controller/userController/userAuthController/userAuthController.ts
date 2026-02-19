
import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../../../services/userService/userAuthService/IAuthService'; 
import { IUserService } from '../../../services/userService/userProfileServie/IUserProfileService'; 
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { IAuthController } from './IUserAuthController';
import { AppError } from '../../../utils/errorUtil/appError';

export class AuthController implements IAuthController {
  constructor(
    private authService: IAuthService,
    private userService: IUserService
  ) {}

  /**
   * STEP 1: Register - NO DATABASE SAVE
   * - Validates user input
   * - Creates registration token
   * - Sets registrationToken cookie
   * - Sends OTP email
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      const result = await this.authService.initiateRegistration({ name, email, password });

      // Set registration token in HTTP-only cookie
      res.cookie('registrationToken', result.registrationToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 10 * 60 * 1000, // 10 minutes (match JWT_REGISTRATION_EXPIRY)
      });

      res.status(200).json({
        success: true,
        message: 'Registration initiated. Please check your email for OTP.',
        data: {
          email: result.email,
          expiresIn: result.expiresIn
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * STEP 2: Verify OTP and Complete Registration
   * - Gets registration token from cookie
   * - Verifies OTP
   * - Creates user in database
   * - Clears registration token cookie
   */
  verifyOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp } = req.body;
      const registrationToken = req.cookies?.registrationToken;

      if (!registrationToken) {
        throw new AppError('Registration session expired. Please register again.', 400);
      }

      const result = await this.authService.verifyOTPAndCompleteRegistration(
        { email, otp },
        registrationToken
      );

      // Clear registration token cookie
      res.clearCookie('registrationToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resend OTP
   * - No token needed, just email
   */
  resendOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      const result = await this.authService.resendOTP({ email });

      res.status(200).json({
        success: true,
        message: 'OTP resent successfully. Please check your email.',
        data: {
          email,
          expiresIn: result.expiresIn
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login - Only for fully registered users
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login({ email, password });

      // Set auth tokens
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout - Clear all cookies
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Clear all auth cookies
      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');
      res.clearCookie('registrationToken'); // Just in case

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };

  // ============ EXISTING METHODS (unchanged) ============
  
  getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await this.userService.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
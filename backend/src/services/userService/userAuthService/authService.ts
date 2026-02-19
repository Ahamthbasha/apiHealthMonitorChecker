import { IUserRepository } from '../../../repository/userRepo/userAuthRepo/IuserAuthRepo'; 
import { IHashingService } from '../../hashService/IHashService';
import { IJwtService, IRegistrationPayload } from '../../jwtService/IJwtService';
import { IOTPService } from '../../otpService/IOtpService';
import { IEmailService } from '../../emailService/IEmailService';
import { IUser } from '../../../models/userModel';
import { 
  IAuthService, 
  IRegisterDTO, 
  ILoginDTO, 
  IVerifyOTPDTO, 
  IResendOTPDTO,
  IAuthResponse,
  IVerifyOTPResponse
} from './IAuthService';
import { AppError } from '../../../utils/errorUtil/appError';

export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private hashingService: IHashingService,
    private jwtService: IJwtService,
    private otpService: IOTPService,
    private emailService: IEmailService
  ) {}

  /**
   * STEP 1: Initiate Registration
   * - Check if user already exists
   * - Hash password
   * - Create registration token
   * - Send OTP email
   * - NO DATABASE SAVE
   */
  async initiateRegistration(data: IRegisterDTO): Promise<{ 
    registrationToken: string; 
    expiresIn: number;
    email: string;
  }> {
    // Check if user already exists in database
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password immediately
    const hashedPassword = await this.hashingService.hash(data.password);

    // Create registration payload
    const registrationPayload: IRegistrationPayload = {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      timestamp: Date.now()
    };

    // Generate registration token (valid for 10 minutes)
    const registrationToken = this.jwtService.generateRegistrationToken(registrationPayload);

    // Generate and send OTP
    const { expiresIn } = await this.otpService.generateAndSendOTP(data.email);

    return {
      registrationToken,
      expiresIn,
      email: data.email
    };
  }

  /**
   * STEP 2: Verify OTP and Complete Registration
   * - Verify OTP
   * - Decode registration token
   * - Save user to database
   * - Send welcome email
   */
  async verifyOTPAndCompleteRegistration(
    data: IVerifyOTPDTO, 
    registrationToken: string
  ): Promise<IVerifyOTPResponse> {
    // 1. Verify the OTP first
    await this.otpService.verifyOTP(data.email, data.otp);

    // 2. Decode and verify registration token
    let registrationData: IRegistrationPayload;
    try {
      registrationData = this.jwtService.verifyRegistrationToken(registrationToken);
    } catch (error) {
      throw new AppError('Registration session expired. Please register again.', 400);
    }

    // 3. Verify email matches (security check)
    if (registrationData.email !== data.email) {
      throw new AppError('Email mismatch. Please register again.', 400);
    }

    // 4. Double-check user doesn't already exist (race condition)
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // 5. Create user in database (ACTIVE now)
    const user = await this.userRepository.create({
      name: registrationData.name,
      email: registrationData.email,
      password: registrationData.password, // Already hashed
      isActive: true,
      role: 'user'
    } as IUser);

    // 6. Send welcome email (non-blocking)
    this.emailService.sendWelcomeEmail(data.email, registrationData.name).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    return {
      success: true,
      message: 'Email verified successfully. Your account has been created.'
    };
  }

  /**
   * Resend OTP
   * - Check if user exists in database (if not, they're in registration flow)
   * - Resend OTP
   */
  async resendOTP(data: IResendOTPDTO): Promise<{ expiresIn: number }> {
    // Check if user already exists and is active
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser && existingUser.isActive) {
      throw new AppError('This email is already registered and verified.', 409);
    }

    // Resend OTP
    return this.otpService.resendOTP(data.email);
  }

  /**
   * Login
   * - Only for fully registered and active users
   */
  async login(data: ILoginDTO): Promise<IAuthResponse> {
    // Find user with password
    const user = await this.userRepository.findByEmailWithPassword(data.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active (must be fully registered)
    if (!user.isActive) {
      throw new AppError('Please verify your email first. Check your inbox for OTP.', 403);
    }

    // Verify password
    const isPasswordValid = await this.hashingService.compare(
      data.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = this.jwtService.generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      tokens,
    };
  }

  async getCurrentUser(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}
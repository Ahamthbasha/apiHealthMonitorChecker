import { IUserRepository } from '../../../repository/userRepo/userAuthRepo/IuserAuthRepo'; 
import { IHashingService } from '../../hashService/IHashService';
import { IJwtService, IRegistrationPayload } from '../../jwtService/IJwtService';
import { IOTPService } from '../../otpService/IOtpService';
import { IEmailService } from '../../emailService/IEmailService';
import { IUser } from '../../../models/userModel';
import { 
  IAuthService, 
} from './IAuthService';
import { AppError } from '../../../utils/errorUtil/appError';
import { IAuthResponse, ILoginDTO, IRegisterDTO, IResendOTPDTO, IVerifyOTPDTO, IVerifyOTPResponse } from '../../../dto/authDTO';

export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private hashingService: IHashingService,
    private jwtService: IJwtService,
    private otpService: IOTPService,
    private emailService: IEmailService
  ) {}

  async initiateRegistration(data: IRegisterDTO): Promise<{ 
    registrationToken: string; 
    expiresIn: number;
    email: string;
  }> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }
    const hashedPassword = await this.hashingService.hash(data.password);

    const registrationPayload: IRegistrationPayload = {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      timestamp: Date.now()
    };

    const registrationToken = this.jwtService.generateRegistrationToken(registrationPayload);

    const { expiresIn } = await this.otpService.generateAndSendOTP(data.email);

    return {
      registrationToken,
      expiresIn,
      email: data.email
    };
  }

  async verifyOTPAndCompleteRegistration(
    data: IVerifyOTPDTO, 
    registrationToken: string
  ): Promise<IVerifyOTPResponse> {
    await this.otpService.verifyOTP(data.email, data.otp);

    let registrationData: IRegistrationPayload;
    try {
      registrationData = this.jwtService.verifyRegistrationToken(registrationToken);
    } catch (error) {
      throw new AppError('Registration session expired. Please register again.', 400);
    }

    if (registrationData.email !== data.email) {
      throw new AppError('Email mismatch. Please register again.', 400);
    }

    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const user = await this.userRepository.create({
      name: registrationData.name,
      email: registrationData.email,
      password: registrationData.password, 
      isActive: true,
      role: 'user'
    } as IUser);

    this.emailService.sendWelcomeEmail(data.email, registrationData.name).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    return {
      success: true,
      message: 'Email verified successfully. Your account has been created.'
    };
  }

  async resendOTP(data: IResendOTPDTO): Promise<{ expiresIn: number }> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser && existingUser.isActive) {
      throw new AppError('This email is already registered and verified.', 409);
    }

    return this.otpService.resendOTP(data.email);
  }

  
  async login(data: ILoginDTO): Promise<IAuthResponse> {
    const user = await this.userRepository.findByEmailWithPassword(data.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Please verify your email first. Check your inbox for OTP.', 403);
    }

    const isPasswordValid = await this.hashingService.compare(
      data.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

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

import { IUser } from '../../../models/userModel';
import { ITokenPair } from '../../jwtService/IJwtService';

export interface IRegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface ILoginDTO {
  email: string;
  password: string;
}

export interface IVerifyOTPDTO {
  email: string;
  otp: string;
  registrationToken?: string; // Will come from cookie
}

export interface IResendOTPDTO {
  email: string;
}

export interface IRegisterResponse {
  success: boolean;
  message: string;
  email: string;
  expiresIn: number;
}

export interface IVerifyOTPResponse {
  success: boolean;
  message: string;
}

export interface IAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  tokens: ITokenPair;
}

export interface IAuthService {
  // Step 1: Validate registration data, create registration token, send OTP
  initiateRegistration(data: IRegisterDTO): Promise<{ 
    registrationToken: string; 
    expiresIn: number;
    email: string;
  }>;
  
  // Step 2: Verify OTP, decode registration token, save user to DB
  verifyOTPAndCompleteRegistration(
    data: IVerifyOTPDTO, 
    registrationToken: string
  ): Promise<IVerifyOTPResponse>;
  
  // Resend OTP
  resendOTP(data: IResendOTPDTO): Promise<{ expiresIn: number }>;
  
  // Login
  login(data: ILoginDTO): Promise<IAuthResponse>;
  
  // Get current user
  getCurrentUser(userId: string): Promise<IUser>;
}
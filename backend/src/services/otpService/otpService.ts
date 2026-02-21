import { IOTPService } from './IOtpService';
import { IOTPRepository } from '../../repository/userRepo/otpRepo/IOtpRepo'; 
import { IEmailService } from '../emailService/IEmailService';
import { AppError } from '../../utils/errorUtil/appError';
import crypto from 'crypto';

export class OTPService implements IOTPService {
  private readonly OTP_EXPIRY_SECONDS = 60;
  private readonly RESEND_COOLDOWN_SECONDS = 30;

  constructor(
    private otpRepository: IOTPRepository,
    private emailService: IEmailService
  ) {}

  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private isOTPExpired(createdAt: Date): boolean {
    const now = new Date();
    const expiryTime = new Date(createdAt.getTime() + (this.OTP_EXPIRY_SECONDS * 1000));
    return now > expiryTime;
  }

  async generateAndSendOTP(email: string): Promise<{ expiresIn: number }> {
    const existingOTP = await this.otpRepository.findByEmail(email);

    if (existingOTP && !this.isOTPExpired(existingOTP.createdAt)) {
      const timeLeft = Math.ceil(
        (existingOTP.createdAt.getTime() + (this.OTP_EXPIRY_SECONDS * 1000) - Date.now()) / 1000
      );
      throw new AppError(
        `An OTP has already been sent. Please wait ${timeLeft} seconds before requesting a new one.`,
        429
      );
    }

    await this.otpRepository.deleteByEmail(email);

    const otp = this.generateOTP();

    await this.otpRepository.createOTP(email, otp);

    await this.emailService.sendOTPEmail(email, otp);

    return { expiresIn: this.OTP_EXPIRY_SECONDS };
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {

    const otpRecord = await this.otpRepository.findByEmail(email);

    if (!otpRecord) {
      throw new AppError('OTP not found or has expired or incorrect otp', 400);
    }

    if (this.isOTPExpired(otpRecord.createdAt)) {
      await this.otpRepository.deleteByEmail(email);
      throw new AppError('OTP has expired', 400);
    }

    if (otpRecord.otp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    await this.otpRepository.deleteByEmail(email);

    return true;
  }

  async resendOTP(email: string): Promise<{ expiresIn: number }> {
    const existingOTP = await this.otpRepository.findByEmail(email);
    
    if (existingOTP && !this.isOTPExpired(existingOTP.createdAt)) {
      const timeSinceCreation = (Date.now() - existingOTP.createdAt.getTime()) / 1000;
      
      if (timeSinceCreation < this.RESEND_COOLDOWN_SECONDS) {
        const cooldownRemaining = Math.ceil(this.RESEND_COOLDOWN_SECONDS - timeSinceCreation);
        throw new AppError(
          `Please wait ${cooldownRemaining} seconds before requesting a new OTP`,
          429
        );
      }
    }

    await this.otpRepository.deleteByEmail(email);
    
    return this.generateAndSendOTP(email);
  }
}
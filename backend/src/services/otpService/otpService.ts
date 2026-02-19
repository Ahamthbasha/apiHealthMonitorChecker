import { IOTPService } from './IOtpService';
import { IOTPRepository } from '../../repositories/userRepo/otpRepo/IOtpRepo';
import { IEmailService } from '../emailService/IEmailService';
import { AppError } from '../../utils/errorUtil/appError';
import crypto from 'crypto';

export class OTPService implements IOTPService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_SECONDS = 60;
  private readonly MAX_ATTEMPTS = 3;
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
    // Check for existing OTP
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

    // Delete any existing OTPs for this email
    await this.otpRepository.deleteByEmail(email);

    // Generate new OTP
    const otp = this.generateOTP();

    // Save new OTP
    await this.otpRepository.create(email, otp);

    // Send OTP via email
    await this.emailService.sendOTPEmail(email, otp);

    // Return expiresIn seconds
    return { expiresIn: this.OTP_EXPIRY_SECONDS };
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    // Find OTP
    const otpRecord = await this.otpRepository.findByEmail(email);

    if (!otpRecord) {
      throw new AppError('OTP not found or has expired or incorrect otp', 400);
    }

    // Check if expired
    if (this.isOTPExpired(otpRecord.createdAt)) {
      await this.otpRepository.deleteByEmail(email);
      throw new AppError('OTP has expired', 400);
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    // Delete OTP after successful verification
    await this.otpRepository.deleteByEmail(email);

    return true;
  }

  async resendOTP(email: string): Promise<{ expiresIn: number }> {
    // Check cooldown
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

    // Delete existing OTPs and generate new one
    await this.otpRepository.deleteByEmail(email);
    
    // Generate and send new OTP, return expiresIn
    return this.generateAndSendOTP(email);
  }
}
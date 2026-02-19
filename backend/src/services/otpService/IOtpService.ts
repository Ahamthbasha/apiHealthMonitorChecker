export interface IOTPService {
  generateAndSendOTP(email: string): Promise<{ expiresIn: number }>;
  verifyOTP(email: string, otp: string): Promise<boolean>;
  resendOTP(email: string): Promise<{ expiresIn: number }>;
}
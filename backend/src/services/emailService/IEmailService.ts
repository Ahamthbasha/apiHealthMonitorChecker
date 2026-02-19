export interface IEmailService {
  sendOTPEmail(email: string, otp: string): Promise<void>;
  sendWelcomeEmail(email: string, name: string): Promise<void>;
}

export interface IEmailConfig {
  user: string;      // Gmail address
  pass: string;      // Gmail App Password
  fromName?: string; // Display name
}
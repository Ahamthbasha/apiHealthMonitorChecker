export interface IEmailService {
  sendOTPEmail(email: string, otp: string): Promise<void>;
  sendWelcomeEmail(email: string, name: string): Promise<void>;
}

export interface IEmailConfig {
  user: string;     
  pass: string;      
  fromName?: string; 
}
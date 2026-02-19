import nodemailer from 'nodemailer';
import { IEmailService, IEmailConfig } from './IEmailService';
import { AppError } from '../../utils/errorUtil/appError';

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor(config: IEmailConfig) {
    this.fromEmail = config.user;
    this.fromName = config.fromName || 'Task Management System';

    // Create Gmail transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.pass, // App Password, not regular password
      },
      // Optional: Add pool configuration for better performance
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ Gmail SMTP configured successfully');
    } catch (error) {
      console.error('❌ Gmail SMTP configuration error:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Email service configuration failed', 500);
      }
    }
  }

  async sendOTPEmail(email: string, otp: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: 'Your OTP for Registration - Task Management System',
        html: this.getOTPEmailTemplate(otp),
        // Plain text version for email clients without HTML
        text: `Your OTP for registration is: ${otp}. This code is valid for 60 seconds. Never share this OTP with anyone.`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${email}: ${info.messageId}`);
    } catch (error: any) {
      console.error('Gmail Error Details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
      });

      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Failed to send OTP email. Please try again.', 500);
      } else {
        // In development, log OTP to console instead of throwing
        console.log(`=================================`);
        console.log(`🔐 [DEV] OTP for ${email}: ${otp}`);
        console.log(`=================================`);
      }
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: 'Welcome to Task Management System! 🎉',
        html: this.getWelcomeEmailTemplate(name),
        text: `Welcome ${name}! Your account has been successfully verified. Login to start managing your tasks: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}: ${info.messageId}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw - welcome email is non-critical
    }
  }

  private getOTPEmailTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            background-color: #f4f6f9;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h2 {
            font-size: 24px;
            margin-bottom: 8px;
          }
          .header p {
            font-size: 16px;
            opacity: 0.95;
          }
          .content {
            padding: 40px 30px;
            background-color: #ffffff;
          }
          .otp-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
          }
          .otp-code {
            font-size: 48px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            font-family: 'Courier New', monospace;
          }
          .timer-info {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            text-align: center;
            border-left: 4px solid #2563eb;
          }
          .warning {
            background-color: #fee2e2;
            border-radius: 8px;
            padding: 16px;
            margin-top: 30px;
            border-left: 4px solid #dc2626;
          }
          .warning p {
            color: #991b1b;
            font-size: 14px;
            margin-bottom: 4px;
          }
          .footer {
            padding: 20px;
            text-align: center;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 4px;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 20px; }
            .otp-code { font-size: 32px; letter-spacing: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Email Verification</h2>
            <p>Task Management System</p>
          </div>
          <div class="content">
            <p style="font-size: 18px; color: #1f2937;">Hello,</p>
            <p style="color: #4b5563; margin-top: 8px;">
              Thank you for registering! Please use the following OTP to verify your email address:
            </p>
            
            <div class="otp-container">
              <div style="color: rgba(255,255,255,0.9); margin-bottom: 12px; font-size: 14px;">
                Your Verification Code
              </div>
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="timer-info">
              <p style="color: #1f2937; font-weight: 600;">
                ⏰ Valid for <span style="color: #2563eb;">60 seconds</span>
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">
                This code will expire in 60 seconds
              </p>
            </div>
            
            <div style="margin: 30px 0;">
              <p style="color: #4b5563; font-size: 14px; margin-bottom: 8px;">
                <strong>Didn't request this?</strong>
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
            
            <div class="warning">
              <p style="font-weight: 600; margin-bottom: 4px;">
                ⚠️ Never share this OTP
              </p>
              <p style="color: #991b1b; font-size: 13px;">
                Our team will never ask for your OTP. Keep it confidential.
              </p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
            <p style="margin-top: 8px;">
              <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 8px;">Privacy Policy</a> • 
              <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 8px;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(name: string): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            background-color: #f4f6f9;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            font-size: 32px;
            margin-bottom: 8px;
          }
          .content {
            padding: 40px 30px;
          }
          .welcome-message {
            background-color: #ecfdf5;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid #a7f3d0;
          }
          .features {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin: 30px 0;
          }
          .feature {
            flex: 1 1 calc(50% - 8px);
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 16px;
            border: 1px solid #e5e7eb;
          }
          .feature-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          .feature-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
          }
          .feature-description {
            color: #6b7280;
            font-size: 13px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
          }
          .button:hover {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          }
          .footer {
            padding: 20px;
            text-align: center;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          @media (max-width: 600px) {
            .feature { flex: 1 1 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome Aboard!</h1>
            <p style="font-size: 18px; opacity: 0.95;">${name}</p>
          </div>
          <div class="content">
            <div class="welcome-message">
              <p style="color: #065f46; font-size: 18px; font-weight: 600; margin-bottom: 8px;">
                Your email has been verified!
              </p>
              <p style="color: #047857;">
                We're excited to have you on board. Your account is now active and ready to use.
              </p>
            </div>
            
            <p style="color: #1f2937; font-size: 18px; font-weight: 600; margin-bottom: 16px;">
              What you can do now:
            </p>
            
            <div class="features">
              <div class="feature">
                <div class="feature-icon">✅</div>
                <div class="feature-title">Create Tasks</div>
                <div class="feature-description">Organize your work with custom tasks</div>
              </div>
              <div class="feature">
                <div class="feature-icon">💬</div>
                <div class="feature-title">Add Comments</div>
                <div class="feature-description">Collaborate with team members</div>
              </div>
              <div class="feature">
                <div class="feature-icon">📎</div>
                <div class="feature-title">Attach Files</div>
                <div class="feature-description">Share documents and images</div>
              </div>
              <div class="feature">
                <div class="feature-icon">📊</div>
                <div class="feature-title">Track Progress</div>
                <div class="feature-description">Monitor your productivity</div>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${frontendUrl}/login" class="button">
                🚀 Go to Dashboard
              </a>
              <p style="color: #6b7280; font-size: 14px; margin-top: 12px;">
                Start managing your tasks efficiently
              </p>
            </div>
            
            <p style="color: #4b5563; margin-top: 30px;">
              Best regards,<br>
              <strong style="color: #1f2937;">Task Management System Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Task Management System</p>
            <p style="margin-top: 8px; font-size: 12px;">
              <a href="${frontendUrl}" style="color: #6b7280; text-decoration: none;">Home</a> • 
              <a href="#" style="color: #6b7280; text-decoration: none;">Support</a> • 
              <a href="#" style="color: #6b7280; text-decoration: none;">Contact</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
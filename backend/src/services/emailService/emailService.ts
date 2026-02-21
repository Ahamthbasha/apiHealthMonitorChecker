import nodemailer from 'nodemailer';
import { IEmailService, IEmailConfig } from './IEmailService';
import { AppError } from '../../utils/errorUtil/appError';

interface GmailError extends Error {
  code?: string;
  command?: string;
  response?: string;
}

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor(config: IEmailConfig) {
    this.fromEmail = config.user;
    this.fromName = config.fromName || 'API Health Monitor';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('Gmail SMTP configured successfully');
    } catch (error) {
      console.error('Gmail SMTP configuration error:', error);
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
        subject: 'Your OTP for Registration - API Health Monitor',
        html: this.getOTPEmailTemplate(otp),
        text: `Your OTP for registration is: ${otp}. This code is valid for 60 seconds. Never share this OTP with anyone.`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}: ${info.messageId}`);
    } catch (error) {
      const gmailError = error as GmailError;
      console.error('Gmail Error Details:', {
        message: gmailError.message,
        code: gmailError.code,
        command: gmailError.command,
        response: gmailError.response,
      });

      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Failed to send OTP email. Please try again.', 500);
      } else {
        console.log(`=================================`);
        console.log(`[DEV] OTP for ${email}: ${otp}`);
        console.log(`=================================`);
      }
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: 'Welcome to API Health Monitor! 🚀',
        html: this.getWelcomeEmailTemplate(name),
        text: `Welcome ${name}! Your account has been successfully verified. Login to start monitoring your APIs: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}: ${info.messageId}`);
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            background-color: #0f172a;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
            border: 1px solid #334155;
          }
          .header {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
          }
          .header-badge {
            display: inline-block;
            background: rgba(255,255,255,0.15);
            border-radius: 20px;
            padding: 4px 14px;
            font-size: 12px;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 12px;
          }
          .header h2 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .header p {
            font-size: 14px;
            opacity: 0.85;
          }
          .status-bar {
            background: #0ea5e9;
            height: 3px;
            width: 100%;
          }
          .content {
            padding: 36px 28px;
            background-color: #1e293b;
            color: #cbd5e1;
          }
          .content p {
            font-size: 15px;
            color: #94a3b8;
            line-height: 1.7;
          }
          .otp-container {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            border: 1px solid #0ea5e9;
            border-radius: 12px;
            padding: 32px;
            margin: 28px 0;
            text-align: center;
            box-shadow: 0 0 20px rgba(14, 165, 233, 0.15);
          }
          .otp-label {
            color: #64748b;
            font-size: 12px;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 14px;
          }
          .otp-code {
            font-size: 52px;
            font-weight: 800;
            letter-spacing: 10px;
            color: #0ea5e9;
            font-family: 'Courier New', monospace;
            text-shadow: 0 0 20px rgba(14, 165, 233, 0.4);
          }
          .timer-info {
            background-color: #0f172a;
            border-radius: 8px;
            padding: 16px 20px;
            margin: 20px 0;
            text-align: center;
            border-left: 4px solid #f59e0b;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .timer-info p {
            color: #f59e0b;
            font-size: 14px;
            font-weight: 600;
          }
          .info-box {
            background-color: #0f172a;
            border-radius: 8px;
            padding: 16px 20px;
            margin: 20px 0;
            border: 1px solid #334155;
          }
          .info-box p {
            color: #64748b;
            font-size: 13px;
          }
          .warning {
            background-color: #1c1917;
            border-radius: 8px;
            padding: 16px 20px;
            margin-top: 28px;
            border-left: 4px solid #ef4444;
          }
          .warning p {
            color: #fca5a5;
            font-size: 13px;
            margin-bottom: 4px;
          }
          .warning .warning-title {
            color: #f87171;
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 6px;
          }
          .footer {
            padding: 20px 28px;
            text-align: center;
            background-color: #0f172a;
            border-top: 1px solid #1e293b;
          }
          .footer p {
            color: #475569;
            font-size: 12px;
            margin-bottom: 4px;
          }
          .footer a {
            color: #64748b;
            text-decoration: none;
            margin: 0 8px;
          }
          .footer a:hover { color: #0ea5e9; }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 20px 16px; }
            .otp-code { font-size: 36px; letter-spacing: 6px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-badge">🟢 API Health Monitor</div>
            <h2>🔐 Email Verification Required</h2>
            <p>Verify your identity to activate monitoring</p>
          </div>
          <div class="status-bar"></div>
          <div class="content">
            <p>Hello,</p>
            <p style="margin-top: 10px;">
              You've requested access to <strong style="color: #e2e8f0;">API Health Monitor</strong>. 
              Use the verification code below to complete your registration and start monitoring your endpoints.
            </p>

            <div class="otp-container">
              <div class="otp-label">Verification Code</div>
              <div class="otp-code">${otp}</div>
            </div>

            <div class="timer-info">
              <p>⏱ This code expires in <span style="color: #fbbf24;">60 seconds</span></p>
            </div>

            <div class="info-box">
              <p>
                <strong style="color: #94a3b8;">Didn't request this?</strong><br/>
                If you didn't attempt to register, you can safely ignore this email. 
                No changes have been made to any account.
              </p>
            </div>

            <div class="warning">
              <p class="warning-title">⚠️ Security Notice</p>
              <p>Never share this code with anyone. Our support team will never ask for your OTP.</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} API Health Monitor. All rights reserved.</p>
            <p style="margin-top: 6px;">
              <a href="#">Privacy Policy</a> •
              <a href="#">Terms of Service</a> •
              <a href="#">Support</a>
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            background-color: #0f172a;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
            border: 1px solid #334155;
          }
          .header {
            background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
            color: white;
            padding: 40px 24px;
            text-align: center;
          }
          .header h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
          .header p { font-size: 15px; opacity: 0.9; }
          .status-bar { background: #22c55e; height: 3px; width: 100%; }
          .content { padding: 36px 28px; background-color: #1e293b; }
          .verified-badge {
            background: linear-gradient(135deg, #052e16 0%, #14532d 100%);
            border: 1px solid #16a34a;
            border-radius: 10px;
            padding: 20px 24px;
            margin: 24px 0;
          }
          .verified-badge p { color: #4ade80; font-size: 15px; }
          .verified-badge .badge-title {
            color: #22c55e;
            font-size: 17px;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .section-title {
            color: #e2e8f0;
            font-size: 16px;
            font-weight: 700;
            margin: 28px 0 16px;
          }
          .features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 16px 0 28px;
          }
          .feature {
            background-color: #0f172a;
            border-radius: 10px;
            padding: 18px;
            border: 1px solid #334155;
          }
          .feature-icon { font-size: 22px; margin-bottom: 10px; }
          .feature-title { font-weight: 600; color: #e2e8f0; font-size: 14px; margin-bottom: 4px; }
          .feature-description { color: #64748b; font-size: 12px; line-height: 1.5; }
          .stats-row {
            display: flex;
            gap: 12px;
            margin: 20px 0;
          }
          .stat-box {
            flex: 1;
            background: #0f172a;
            border-radius: 8px;
            padding: 14px;
            text-align: center;
            border: 1px solid #334155;
          }
          .stat-value { color: #0ea5e9; font-size: 22px; font-weight: 800; }
          .stat-label { color: #64748b; font-size: 11px; margin-top: 2px; }
          .cta-container { text-align: center; margin: 28px 0 8px; }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
            padding: 14px 36px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 4px 14px rgba(14, 165, 233, 0.35);
            letter-spacing: 0.3px;
          }
          .cta-sub {
            color: #475569;
            font-size: 13px;
            margin-top: 10px;
          }
          .sign-off { color: #64748b; margin-top: 28px; font-size: 14px; }
          .sign-off strong { color: #94a3b8; }
          .footer {
            padding: 20px 28px;
            text-align: center;
            background-color: #0f172a;
            border-top: 1px solid #1e293b;
          }
          .footer p { color: #475569; font-size: 12px; margin-bottom: 4px; }
          .footer a { color: #64748b; text-decoration: none; margin: 0 8px; }
          .footer a:hover { color: #0ea5e9; }
          @media (max-width: 600px) {
            .features { grid-template-columns: 1fr; }
            .stats-row { flex-direction: column; }
            .content { padding: 20px 16px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 You're All Set!</h1>
            <p>Welcome to API Health Monitor, <strong>${name}</strong></p>
          </div>
          <div class="status-bar"></div>
          <div class="content">

            <div class="verified-badge">
              <p class="badge-title">✅ Email Verified Successfully</p>
              <p>Your account is now active. You can start monitoring your API endpoints and receive real-time alerts.</p>
            </div>

            <p class="section-title">📊 What you can monitor:</p>

            <div class="features">
              <div class="feature">
                <div class="feature-icon">🌐</div>
                <div class="feature-title">Endpoint Health</div>
                <div class="feature-description">Monitor HTTP/HTTPS endpoints and track uptime in real time</div>
              </div>
              <div class="feature">
                <div class="feature-icon">⏱</div>
                <div class="feature-title">Response Times</div>
                <div class="feature-description">Track latency trends and detect performance degradation</div>
              </div>
              <div class="feature">
                <div class="feature-icon">🔔</div>
                <div class="feature-title">Threshold Alerts</div>
                <div class="feature-description">Get notified when failure thresholds are exceeded</div>
              </div>
              <div class="feature">
                <div class="feature-icon">📈</div>
                <div class="feature-title">Uptime Reports</div>
                <div class="feature-description">View historical stats and 24h availability reports</div>
              </div>
            </div>

            <div class="stats-row">
              <div class="stat-box">
                <div class="stat-value">60s</div>
                <div class="stat-label">Min Check Interval</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">5xx</div>
                <div class="stat-label">Error Detection</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">Live</div>
                <div class="stat-label">WebSocket Updates</div>
              </div>
            </div>

            <div class="cta-container">
              <a href="${frontendUrl}/login" class="button">
                🖥 Open Dashboard
              </a>
              <p class="cta-sub">Add your first endpoint and start monitoring in seconds</p>
            </div>

            <p class="sign-off">
              Best regards,<br/>
              <strong>API Health Monitor Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} API Health Monitor. All rights reserved.</p>
            <p style="margin-top: 6px;">
              <a href="${frontendUrl}">Dashboard</a> •
              <a href="#">Support</a> •
              <a href="#">Documentation</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
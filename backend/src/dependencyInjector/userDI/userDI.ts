
import { IUserRepository } from "../../repository/userRepo/userAuthRepo/IuserAuthRepo"; 
import { UserRepository } from "../../repository/userRepo/userAuthRepo/userAuthRepo";

import { IHashingService } from "../../services/hashService/IHashService"; 
import { HashingService } from "../../services/hashService/hashService"; 

import { IJwtService } from "../../services/jwtService/IJwtService";
import { JwtService } from "../../services/jwtService/jwtService"; 

import { IAuthService } from "../../services/userService/userAuthService/IAuthService"; 
import { AuthService } from "../../services/userService/userAuthService/authService";  

import { IAuthController } from "../../controller/userController/userAuthController/IUserAuthController"; 
import { AuthController } from "../../controller/userController/userAuthController/userAuthController"; 
import { IAuthMiddleware } from "../../middlewares/authMiddleware";
import { AuthMiddleware } from "../../middlewares/authMiddleware";

import { IUserService } from "../../services/userService/userProfileServie/IUserProfileService"; 
import { UserService } from "../../services/userService/userProfileServie/userProfileService"; 

import { IOTPRepository } from "../../repository/userRepo/otpRepo/IOtpRepo"; 
import { OTPRepository } from "../../repository/userRepo/otpRepo/otpRepo"; 
import { IOTPService } from "../../services/otpService/IOtpService"; 
import { OTPService } from "../../services/otpService/otpService"; 

import { IEmailService } from "../../services/emailService/IEmailService"; 
import { EmailService } from "../../services/emailService/emailService";

import { IApiEndpointRepository } from "../../repository/userRepo/apiEndpointRepo/IApiEndpointRepo"; 
import { ApiEndpointRepository } from "../../repository/userRepo/apiEndpointRepo/apiEndpointRepo"; 
import { IApiEndpointService } from "../../services/userService/userApiService/IApiEndpointService"; 
import { ApiEndpointService } from "../../services/userService/userApiService/apiEndpointService"; 
import { ApiEndpointController } from "../../controller/userController/userApiController/userApiEndpointController"; 
import { IApiEndpointController } from "../../controller/userController/userApiController/IUserApiEndpointController"; 

import { IHealthCheckRepository } from "../../repository/userRepo/healthCheckRepo/IHealthCheckRepo";
import { HealthCheckRepository } from "../../repository/userRepo/healthCheckRepo/healthCheckRepo";
import { IHealthCheckService } from "../../services/userService/userHealthCheckService/IHealthCheckService";
import { HealthCheckService } from "../../services/userService/userHealthCheckService/healthCheckService";
import { IHealthCheckController } from "../../controller/userController/userHealthCheckcontroller/IHealthCheckController";
import { HealthCheckController } from "../../controller/userController/userHealthCheckcontroller/healthCheckController";

import { WebSocketService } from "../../services/websocketService/websocketService";
import { Server as HttpServer } from "http";

const hasGmailConfig = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;

let emailService: IEmailService;

if (hasGmailConfig) {
  emailService = new EmailService({
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_APP_PASSWORD!,
    fromName: process.env.GMAIL_FROM_NAME || 'Task Management System'
  });
  console.log('📧 Using Gmail SMTP for emails');
} else {
  console.warn('⚠️ Gmail credentials not found. Using console logging for emails.');
  emailService = {
    sendOTPEmail: async (email: string, otp: string) => {
      console.log('=================================');
      console.log(`🔐 [DEV MODE] OTP for ${email}: ${otp}`);
      console.log('=================================');
    },
    sendWelcomeEmail: async (email: string, name: string) => {
      console.log(`📧 [DEV MODE] Welcome email sent to ${name} (${email})`);
    }
  } as IEmailService;
}

const otpRepo: IOTPRepository = new OTPRepository();
const otpService: IOTPService = new OTPService(otpRepo, emailService);

const hashService: IHashingService = new HashingService();
const jwtService: IJwtService = new JwtService();

const userRepo: IUserRepository = new UserRepository();
const userService: IAuthService = new AuthService(userRepo, hashService, jwtService, otpService, emailService);
const userAssignService: IUserService = new UserService(userRepo);
const userController: IAuthController = new AuthController(userService, userAssignService);

const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService, userRepo);

const userApiEndpointRepository: IApiEndpointRepository = new ApiEndpointRepository();
const userHealthCheckRepo: IHealthCheckRepository = new HealthCheckRepository();

const userHealthCheckService: IHealthCheckService = new HealthCheckService(userHealthCheckRepo, userApiEndpointRepository);

let wsService: WebSocketService | null = null;

let userApiEndpointService: IApiEndpointService = new ApiEndpointService(
  userApiEndpointRepository, 
  userHealthCheckRepo
);

export const setWebSocketForApiService = (webSocketService: WebSocketService) => {
  userApiEndpointService = new ApiEndpointService(
    userApiEndpointRepository,
    userHealthCheckRepo,
    webSocketService
  );
  console.log('✅ WebSocket service injected into ApiEndpointService');
  
  return userApiEndpointService;
};

const userApiEndpointController: IApiEndpointController = new ApiEndpointController(userApiEndpointService);

const userHealthCheckController: IHealthCheckController = new HealthCheckController(userHealthCheckService);

export const initializeWebSocket = (server: HttpServer): WebSocketService => {
  if (!wsService) {
    wsService = new WebSocketService(
      server,
      userHealthCheckService,
      userApiEndpointRepository,
      jwtService
    );
    console.log('WebSocket service initialized');
    
    setWebSocketForApiService(wsService);
  }
  return wsService;
};

export const getWebSocketService = (): WebSocketService | null => {
  return wsService;
};

export const startMonitoringEngine = () => {
  userHealthCheckService.startMonitoring();
  
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, stopping monitoring engine...');
    userHealthCheckService.stopMonitoring();
    
    if (wsService) {
      wsService.cleanup();
    }
    
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, stopping monitoring engine...');
    userHealthCheckService.stopMonitoring();
    
    if (wsService) {
      wsService.cleanup();
    }
    
    process.exit(0);
  });
};

export {
  userController,
  authMiddleware,
  userApiEndpointController,
  userHealthCheckController
};
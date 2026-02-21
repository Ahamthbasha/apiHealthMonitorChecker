import { ITokenPair } from "../services/jwtService/IJwtService";

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
  registrationToken?: string;
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

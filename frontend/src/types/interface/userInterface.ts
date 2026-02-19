export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

export interface ResendOTPData {
  email: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    expiresIn: number;
  };
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
}
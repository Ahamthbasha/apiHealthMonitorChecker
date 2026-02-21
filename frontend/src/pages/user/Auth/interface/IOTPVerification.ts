export interface LocationState {
  email: string;
  expiresIn?: number;
}

export interface ErrorResponse {
  success: boolean;
  message?: string;
  data?: { expiresIn?: number };
}

export interface ResendOTPResponse {
  success: boolean;
  message?: string;
  data?: { expiresIn?: number };
}
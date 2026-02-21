

export interface ValidationError {
  msg: string;
  path: string;
}

export interface ErrorResponse {
  success: boolean;
  message?: string;
  errors?: ValidationError[];
}
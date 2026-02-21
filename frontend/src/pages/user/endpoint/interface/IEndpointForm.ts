export interface HeaderField {
  key: string;
  value: string;
}

export interface ValidationError {
  msg: string;
  path: string;
}

export interface ApiError {
  response?: {
    data?: {
      errors?: ValidationError[];
      message?: string;
    };
  };
  message?: string;
}

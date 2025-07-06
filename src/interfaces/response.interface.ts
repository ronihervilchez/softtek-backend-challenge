export interface ApiResponse<T = any> {
  statusCode: number;
  body: string;
}

export interface ResponseBody<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
  timestamp: string;
}

export interface ValidationResult<T = any> {
  isValid: boolean;
  dto?: T;
  errors: string[];
}

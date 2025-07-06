import { ApiResponse, ResponseBody } from '../interfaces';

export class ResponseUtil {
  static success<T>(data: T, message?: string): ResponseBody<T> {
    return {
      success: true,
      data,
      message: message ?? 'Operación exitosa',
      timestamp: new Date().toISOString(),
    };
  }

  static error(errors: string[], message?: string): ResponseBody {
    return {
      success: false,
      errors,
      message: message ?? 'Error procesando la solicitud',
      timestamp: new Date().toISOString(),
    };
  }

  static lambdaResponse<T>(statusCode: number, body: ResponseBody<T>): ApiResponse<T> {
    return {
      statusCode,
      body: JSON.stringify(body),
    };
  }
}

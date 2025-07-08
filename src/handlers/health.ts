import { ResponseUtil } from '../utils/response.util';
import { ApiResponse } from '../interfaces/response.interface';

export const handler = async (event: any, context: any): Promise<ApiResponse<any>> => {
  console.log('Health Check - Event:', JSON.stringify(event, null, 2));

  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      stage: process.env.STAGE ?? 'dev',
      region: process.env.AWS_REGION ?? 'us-east-1',
      service: 'softtek-backend-challenge',
      uptime: process.uptime()
    };

    const response = ResponseUtil.success(healthData, 'Servicio funcionando correctamente');
    return ResponseUtil.lambdaResponse(200, response);
  } catch (error) {
    const errorResponse = ResponseUtil.error(
      [error instanceof Error ? error.message : 'Error desconocido'],
      'Error en health check'
    );
    return ResponseUtil.lambdaResponse(500, errorResponse);
  }
};

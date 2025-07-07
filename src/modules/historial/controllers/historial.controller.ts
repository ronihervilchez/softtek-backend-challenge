import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getHistorialService } from '../../database/services/historial.service';
import { ResponseUtil } from '../../../utils/response.util';

export class HistorialController {
  private readonly historialService = getHistorialService();

  async getHistorial(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('📋 Obteniendo historial...');
      
      // Extraer parámetros de query
      const queryParams = event.queryStringParameters ?? {};
      const limit = parseInt(queryParams.limit ?? '10');
      const lastEvaluatedKey = queryParams.lastKey ? JSON.parse(queryParams.lastKey) : undefined;
      
      const data = await this.historialService.getHistorial(limit, lastEvaluatedKey);
      
      console.log(`✅ Historial obtenido exitosamente: ${data.histories.length} registros`);
      
      return ResponseUtil.lambdaResponse(200, ResponseUtil.success(data, 'Historial obtenido exitosamente'));
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      return ResponseUtil.lambdaResponse(500, ResponseUtil.error(
        [error instanceof Error ? error.message : 'Error desconocido'],
        'Error al obtener historial'
      ));
    }
  }
}

// Instancia del controlador
const historialController = new HistorialController();

// Handler para Lambda
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return historialController.getHistorial(event, context);
};

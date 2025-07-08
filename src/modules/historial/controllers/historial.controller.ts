import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getHistorialService } from '../services/historial.service';
import { ResponseUtil } from '../../../utils/response.util';

export class HistorialController {
  private readonly historialService = getHistorialService();

  async getHistorial(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('📋 Obteniendo historial...');
      
      // Extraer y validar parámetros de query
      const queryParams = event.queryStringParameters ?? {};
      
      // Validar y parsear limit con rangos razonables
      let limit = 10; // Valor por defecto
      if (queryParams.limit) {
        const parsedLimit = parseInt(queryParams.limit);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          return ResponseUtil.lambdaResponse(400, ResponseUtil.error(
            ['El parámetro limit debe ser un número entero mayor a 0'],
            'Parámetro inválido'
          ));
        }
        if (parsedLimit > 100) {
          return ResponseUtil.lambdaResponse(400, ResponseUtil.error(
            ['El parámetro limit no puede ser mayor a 100'],
            'Parámetro inválido'
          ));
        }
        limit = parsedLimit;
      }
      
      const lastEvaluatedKey = queryParams.lastKey ? 
        JSON.parse(decodeURIComponent(queryParams.lastKey)) : 
        undefined;
      
      console.log(`📋 Consultando historial con limit: ${limit}`);
      const data = await this.historialService.getHistorial(limit, lastEvaluatedKey);
      
      // Preparar respuesta con información de paginación
      const response = {
        ...data,
        // Si hay próxima página, incluir lastEvaluatedKey codificado para el cliente
        nextPageToken: data.hasNextPage && data.lastEvaluatedKey ? 
          encodeURIComponent(JSON.stringify(data.lastEvaluatedKey)) : 
          undefined
      };
      
      // Remover lastEvaluatedKey del response ya que usamos nextPageToken
      delete response.lastEvaluatedKey;
      
      console.log(`✅ Historial obtenido exitosamente: ${data.histories.length} registros (limit solicitado: ${limit}), hasNextPage: ${data.hasNextPage}`);
      
      return ResponseUtil.lambdaResponse(200, ResponseUtil.success(response, 'Historial obtenido exitosamente'));
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

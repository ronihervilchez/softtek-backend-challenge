import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { HistorialService, HistorialServiceImpl } from '../services/historial.service';
import { ResponseUtil } from '../../../utils/response.util';

export class HistorialController {
  private readonly historialService: HistorialService;

  constructor(historialService?: HistorialService) {
    this.historialService = historialService || new HistorialServiceImpl();
  }

  async getHistorial(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('📋 Obteniendo historial...');
      
      // Extraer filtros de query parameters si existen
      const filters = event.queryStringParameters ?? {};
      
      const data = await this.historialService.getHistorial(filters);
      
      console.log(`✅ Historial obtenido exitosamente: ${data.length} registros`);
      
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

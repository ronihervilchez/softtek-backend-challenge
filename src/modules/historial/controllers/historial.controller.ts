import { HistorialService, HistorialServiceImpl } from '../services/historial.service';
import { ResponseUtil } from '../../../utils/response.util';
import { ApiResponse, HistorialResult } from '../../../interfaces';

export class HistorialController {
  private readonly historialService: HistorialService;

  constructor(historialService?: HistorialService) {
    this.historialService = historialService || new HistorialServiceImpl();
  }

  async getHistorial(event: any): Promise<ApiResponse<HistorialResult[]>> {
    try {
      // Extraer filtros de query parameters si existen
      const filters = event.queryStringParameters ?? {};
      
      const data = await this.historialService.getHistorial(filters);
      
      const response = ResponseUtil.success(data, 'Historial obtenido exitosamente');
      return ResponseUtil.lambdaResponse(200, response);
    } catch (error) {
      const errorResponse = ResponseUtil.error(
        [error instanceof Error ? error.message : 'Error desconocido'],
        'Error al obtener historial'
      );
      return ResponseUtil.lambdaResponse(500, errorResponse);
    }
  }
}

// Función handler unificada para Lambda
const historialController = new HistorialController();

export const handler = async (event: any, context: any): Promise<ApiResponse<HistorialResult[]>> => {
  return historialController.getHistorial(event);
};

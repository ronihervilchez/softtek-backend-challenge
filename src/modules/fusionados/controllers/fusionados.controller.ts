import { FusionadosService, FusionadosServiceImpl } from '../services/fusionados.service';
import { ResponseUtil } from '../../../utils/response.util';
import { ApiResponse, FusionadosResult } from '../../../interfaces';

export class FusionadosController {
  private readonly fusionadosService: FusionadosService;

  constructor(fusionadosService?: FusionadosService) {
    this.fusionadosService = fusionadosService || new FusionadosServiceImpl();
  }

  async getFusionados(event: any): Promise<ApiResponse<FusionadosResult[]>> {
    try {
      // Extraer filtros de query parameters si existen
      const filters = event.queryStringParameters ?? {};
      
      const data = await this.fusionadosService.getFusionados(filters);
      
      const response = ResponseUtil.success(data, 'Datos fusionados obtenidos exitosamente');
      return ResponseUtil.lambdaResponse(200, response);
    } catch (error) {
      const errorResponse = ResponseUtil.error(
        [error instanceof Error ? error.message : 'Error desconocido'],
        'Error al obtener datos fusionados'
      );
      return ResponseUtil.lambdaResponse(500, errorResponse);
    }
  }
}

// Función handler unificada para Lambda
const fusionadosController = new FusionadosController();

export const handler = async (event: any, context: any): Promise<ApiResponse<FusionadosResult[]>> => {
  return fusionadosController.getFusionados(event);
};

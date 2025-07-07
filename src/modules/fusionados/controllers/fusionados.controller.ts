import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { FusionadosService, FusionadosServiceImpl } from '../services/fusionados.service';
import { ResponseUtil } from '../../../utils/response.util';

export class FusionadosController {
  private readonly fusionadosService: FusionadosService;

  constructor(fusionadosService?: FusionadosService) {
    this.fusionadosService = fusionadosService || new FusionadosServiceImpl();
  }

  async getFusionados(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('🔄 Iniciando proceso de fusión de datos...');
      
      // Extraer filtros de query parameters si existen
      const filters = event.queryStringParameters ?? {};
      
      const data = await this.fusionadosService.getFusionados(filters);
      
      console.log(`✅ Datos fusionados obtenidos: ${data.length} elementos`);
      
      return ResponseUtil.lambdaResponse(200, ResponseUtil.success(data, 'Datos fusionados obtenidos exitosamente'));
    } catch (error) {
      console.error('❌ Error al obtener datos fusionados:', error);
      return ResponseUtil.lambdaResponse(500, ResponseUtil.error(
        [error instanceof Error ? error.message : 'Error desconocido'],
        'Error al obtener datos fusionados'
      ));
    }
  }
}

// Instancia del controlador
const fusionadosController = new FusionadosController();

// Handler para Lambda
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return fusionadosController.getFusionados(event, context);
};

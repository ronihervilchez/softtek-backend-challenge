import { AlmacenarService, AlmacenarServiceImpl } from '../services/almacenar.service';
import { AlmacenarDto } from '../dtos/almacenar.dto';
import { ResponseUtil } from '../../../utils/response.util';
import { ValidationUtil } from '../../../utils/validation.util';
import { ApiResponse, AlmacenarResult } from '../../../interfaces';

export class AlmacenarController {
  private readonly almacenarService: AlmacenarService;

  constructor(almacenarService?: AlmacenarService) {
    this.almacenarService = almacenarService || new AlmacenarServiceImpl();
  }

  async almacenar(event: any): Promise<ApiResponse<AlmacenarResult>> {
    try {
      // Parsear el body de la request
      const body = event.body ? JSON.parse(event.body) : {};

      // Validar el DTO
      const validation = await ValidationUtil.validateDto(AlmacenarDto, body);

      if (!validation.isValid) {
        const errorResponse = ResponseUtil.error(
          validation.errors,
          'Datos de entrada inválidos'
        );
        return ResponseUtil.lambdaResponse(400, errorResponse);
      }

      // Procesar los datos usando el servicio
      const data = await this.almacenarService.almacenar(validation.dto as AlmacenarDto);

      const response = ResponseUtil.success(data, 'Datos almacenados exitosamente');
      return ResponseUtil.lambdaResponse(201, response);
    } catch (error) {
      const errorResponse = ResponseUtil.error(
        [error instanceof Error ? error.message : 'Error desconocido'],
        'Error al almacenar datos'
      );
      return ResponseUtil.lambdaResponse(500, errorResponse);
    }
  }
}

// Función handler unificada para Lambda
const almacenarController = new AlmacenarController();

export const handler = async (event: any, context: any): Promise<ApiResponse<AlmacenarResult>> => {
  return almacenarController.almacenar(event);
};

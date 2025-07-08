import "reflect-metadata";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { ResponseUtil } from "../../../utils/response.util";
import { ValidationUtil } from "../../../utils/validation.util";
import { HistorialDto } from "../dtos/historial.dto";
import { getHistorialService } from "../services/historial.service";

export class HistorialController {
  private readonly historialService = getHistorialService();

  async getHistorial(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log("📋 Iniciando obtención de historial (POST)...");

      // Extraer información del usuario autenticado desde Lambda Authorizer
      const userInfo = event.requestContext.authorizer;
      const userEmail = userInfo?.claims?.email ?? "unknown";
      const userName = userInfo?.claims?.given_name ?? userInfo?.claims?.username ?? "unknown";

      console.log(`👤 Usuario autenticado: ${userName} (${userEmail})`);

      // Parsear y validar el body del POST
      if (!event.body) {
        return ResponseUtil.lambdaResponse(
          400,
          ResponseUtil.error(["El body de la petición es requerido"], "Body faltante")
        );
      }

      let requestData: any;
      try {
        requestData = JSON.parse(event.body);
      } catch (parseError) {
        console.error("❌ Error parseando body JSON:", parseError);
        return ResponseUtil.lambdaResponse(
          400,
          ResponseUtil.error(["El body debe ser un JSON válido"], "JSON malformado")
        );
      }

      // Validar DTO
      const validation = await ValidationUtil.validateDto(HistorialDto, requestData);
      if (!validation.isValid) {
        return ResponseUtil.lambdaResponse(
          400,
          ResponseUtil.error(validation.errors, "Datos de entrada inválidos")
        );
      }

      const { limit, lastEvaluatedKey } = validation.dto as HistorialDto;

      console.log(`� Obteniendo historial para usuario: ${userEmail} (limit: ${limit})`);
      const data = await this.historialService.getHistorial(limit, lastEvaluatedKey);

      console.log(`✅ Historial obtenido: ${data.histories.length} elementos para usuario ${userEmail}`);

      // Preparar respuesta con información de paginación
      const responseData: any = {
        histories: data.histories,
        hasNextPage: data.hasNextPage,
      };

      // Agregar información de paginación si hay más páginas
      if (data.hasNextPage && data.lastEvaluatedKey) {
        responseData.lastEvaluatedKey = data.lastEvaluatedKey; // Para próxima petición POST
      }

      return ResponseUtil.lambdaResponse(
        200,
        ResponseUtil.success(responseData, "Historial obtenido exitosamente")
      );
    } catch (error) {
      console.error("❌ Error al obtener historial:", error);
      return ResponseUtil.lambdaResponse(
        500,
        ResponseUtil.error(
          [error instanceof Error ? error.message : "Error desconocido"],
          "Error al obtener historial"
        )
      );
    }
  }
}

// Instancia del controlador
const historialController = new HistorialController();

// Handler para Lambda
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return historialController.getHistorial(event, context);
};

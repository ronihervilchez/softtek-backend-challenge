import { DynamoDBClient, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { IPerson } from "../../../interfaces/fusionado.interface";
import { IHistory, IHistoryList } from "../../../interfaces/service.interface";
import { HistorialSchema } from "../../database/schemas/database.schemas";

/**
 * Servicio para manejar el historial de datos fusionados
 */
export class HistorialService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION ?? "us-east-1",
    });
    this.tableName = process.env.DYNAMODB_TABLE_DATA ?? "softtek-data";
  }

  /**
   * Guarda datos fusionados en el historial cuando se obtienen de APIs externas
   */
  async saveHistorial(id: string, personas: IPerson[]): Promise<boolean> {
    try {
      const historialData: HistorialSchema = {
        id,
        fechaCreacion: new Date().toISOString(),
        personas,
      };

      const params = {
        TableName: this.tableName,
        Item: {
          id: { S: historialData.id },
          fechaCreacion: { S: historialData.fechaCreacion },
          personas: { S: JSON.stringify(historialData.personas) },
        },
      };

      const command = new PutItemCommand(params);
      await this.dynamoClient.send(command);

      console.log(`📋 Historial guardado con ID: ${id} (${personas.length} personas)`);
      return true;
    } catch (error) {
      console.error(`❌ Error guardando historial:`, error);
      return false;
    }
  }

  /**
   * Obtiene el historial de datos fusionados con paginación real de DynamoDB
   * Nota: Usamos Scan con Limit para paginación eficiente, sin ordenamiento global
   * @param limit - Número máximo de elementos a retornar
   * @param lastEvaluatedKey - Clave del último elemento evaluado (para paginación)
   * @returns Lista de historial con información de paginación
   */
  async getHistorial(limit: number = 10, lastEvaluatedKey?: Record<string, any>): Promise<IHistoryList> {
    try {
      const params: any = {
        TableName: this.tableName,
        Limit: limit, // Aplicar límite real en DynamoDB
      };

      // Si hay paginación pendiente, añadir ExclusiveStartKey para continuar desde donde se quedó
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
        console.log(`📋 Continuando paginación desde: ${JSON.stringify(lastEvaluatedKey)}`);
      }

      const command = new ScanCommand(params);
      const result = await this.dynamoClient.send(command);

      if (!result?.Items?.length) {
        console.log(`📋 No se encontraron elementos en el historial`);
        return {
          histories: [],
          hasNextPage: false,
        };
      }

      // Convertir items de DynamoDB a formato IHistory
      const histories: IHistory[] = result.Items.map((item) => ({
        id: item.id?.S ?? "",
        fechaCreacion: item.fechaCreacion?.S ?? "",
        personas: JSON.parse(item.personas?.S ?? "[]") as IPerson[],
      }));

      // Ordenar esta página por fecha descendente (solo los elementos de esta página)
      histories.sort((a, b) => {
        const dateA = new Date(a.fechaCreacion ?? '').getTime();
        const dateB = new Date(b.fechaCreacion ?? '').getTime();
        return dateB - dateA; // Descendente
      });

      const hasNextPage = !!result.LastEvaluatedKey;

      console.log(`📋 Historial obtenido: ${histories.length} elementos (limit: ${limit}), hasNextPage: ${hasNextPage}`);

      return {
        histories,
        hasNextPage,
        lastEvaluatedKey: result.LastEvaluatedKey, // Para próxima página
      };
    } catch (error) {
      console.error(`❌ Error obteniendo historial:`, error);
      return {
        histories: [],
        hasNextPage: false,
      };
    }
  }
}

// Singleton para reutilizar la instancia
let historialServiceInstance: HistorialService | null = null;

export const getHistorialService = (): HistorialService => {
  historialServiceInstance ??= new HistorialService();
  return historialServiceInstance;
};

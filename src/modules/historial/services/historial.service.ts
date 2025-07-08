import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { IPerson } from "../../../interfaces/fusionado.interface";
import { HistorialSchema } from "../../database/schemas/database.schemas";
import { IHistoryList, IHistory } from "../../../interfaces/service.interface";

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
          categoria: { S: 'historial' }, // Agregar categoría para usar el GSI
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
   * Obtiene el historial de datos fusionados con paginación
   * @param limit - Número máximo de elementos a retornar
   * @param lastEvaluatedKey - Clave del último elemento evaluado (para paginación)
   * @returns Lista de historial con información de paginación
   */
  async getHistorial(limit: number = 10, lastEvaluatedKey?: Record<string, any>): Promise<IHistoryList> {
    try {
      const params: any = {
        TableName: this.tableName,
        IndexName: 'categoria-fecha-index',
        KeyConditionExpression: 'categoria = :categoria',
        ExpressionAttributeValues: {
          ':categoria': { S: 'historial' }
        },
        Limit: limit,
        ScanIndexForward: false, // Ordenar por fecha descendente (más recientes primero)
      };

      // Si hay una clave de evaluación previa, agregarla para paginación
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const command = new QueryCommand(params);
      const result = await this.dynamoClient.send(command);

      if (!result?.Items?.length) {
        console.log(`📋 No se encontraron elementos en el historial`);
        return {
          histories: [],
          hasNextPage: false,
        };
      }

      // Convertir los items de DynamoDB a formato IHistory
      const histories: IHistory[] = result.Items.map(item => ({
        id: item.id?.S,
        fechaCreacion: item.fechaCreacion?.S,
        personas: JSON.parse(item.personas?.S ?? '[]') as IPerson[],
      }));

      const hasNextPage = !!result.LastEvaluatedKey;

      console.log(`📋 Historial obtenido: ${histories.length} elementos, hasNextPage: ${hasNextPage}`);

      return {
        histories,
        hasNextPage,
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

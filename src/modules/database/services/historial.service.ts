import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { IPerson } from "../../../interfaces/fusionado.interface";
import { HistorialSchema } from "../schemas";

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
}

// Singleton para reutilizar la instancia
let historialServiceInstance: HistorialService | null = null;

export const getHistorialService = (): HistorialService => {
  historialServiceInstance ??= new HistorialService();
  return historialServiceInstance;
};

import { DynamoDBClient, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { IPerson } from "../../../interfaces/fusionado.interface";
import { ICacheService } from "../interfaces/cache.interface";
import { CacheSchema } from "../schemas/database.schemas";

/**
 * Servicio de cache para datos fusionados con TTL de 30 minutos
 */
export class CacheService implements ICacheService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;
  private readonly TTL_SECONDS = 1800; // 30 minutos

  constructor() {
    this.dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION ?? "us-east-1",
    });
    // Tabla específica para cache de datos fusionados
    this.tableName = process.env.DYNAMODB_TABLE_CACHE ?? "softtek-cache";
  }

  /**
   * Guarda datos fusionados en cache usando el CacheSchema
   */
  async saveFusionados(id: string, personas: IPerson[]): Promise<boolean> {
    try {
      const ttl = Math.floor(Date.now() / 1000) + this.TTL_SECONDS;

      const cacheData: CacheSchema = {
        id,
        fechaCreacion: new Date().toISOString(),
        personas,
        ttl,
      };

      const params = {
        TableName: this.tableName,
        Item: {
          id: { S: cacheData.id },
          fechaCreacion: { S: cacheData.fechaCreacion },
          personas: { S: JSON.stringify(cacheData.personas) },
          ttl: { N: cacheData.ttl.toString() },
        },
      };

      const command = new PutItemCommand(params);
      await this.dynamoClient.send(command);

      console.log(`💾 Cache fusionados guardado con ID: ${id} (TTL: 30 minutos)`);
      return true;
    } catch (error) {
      console.error(`❌ Error guardando cache fusionados:`, error);
      return false;
    }
  }

  /**
   * Busca datos fusionados cacheados - obtiene el más reciente y valida TTL
   * Usa Scan para obtener todos los elementos y luego ordena por fechaCreacion para garantizar el más reciente
   */
  async findFusionados(): Promise<CacheSchema | null> {
    try {
      const params = {
        TableName: this.tableName,
      };

      const command = new ScanCommand(params);
      const result = await this.dynamoClient.send(command);

      if (!result?.Items?.length) {
        console.log(`🔍 Cache MISS - No hay datos fusionados cacheados`);
        return null;
      }

      // Ordenar por fechaCreacion descendente para obtener el más reciente
      const items = [...result.Items];
      items.sort((a, b) => {
        const dateA = new Date(a.fechaCreacion.S ?? "").getTime();
        const dateB = new Date(b.fechaCreacion.S ?? "").getTime();
        return dateB - dateA; // Descendente: más reciente primero
      });

      const mostRecentItem = items[0];
      const ttl = parseInt(mostRecentItem.ttl.N ?? "0");
      const currentTime = Math.floor(Date.now() / 1000);

      // Validar TTL en memoria después de obtener el dato más reciente
      if (ttl <= currentTime) {
        console.log(
          `🔍 Cache MISS - Datos más recientes encontrados pero TTL expirado (TTL: ${ttl}, Actual: ${currentTime})`
        );
        return null;
      }

      console.log(
        `✅ Cache HIT - Datos fusionados más recientes válidos (TTL restante: ${ttl - currentTime}s)`
      );

      const cacheData: CacheSchema = {
        id: mostRecentItem.id.S ?? "",
        fechaCreacion: mostRecentItem.fechaCreacion.S ?? "",
        personas: JSON.parse(mostRecentItem.personas.S ?? "[]"),
        ttl,
      };

      return cacheData;
    } catch (error) {
      console.error(`❌ Error obteniendo cache fusionados:`, error);
      return null;
    }
  }
}

// Singleton para reutilizar la instancia
let cacheServiceInstance: CacheService | null = null;

export const getCacheService = (): CacheService => {
  cacheServiceInstance ??= new CacheService();
  return cacheServiceInstance;
};

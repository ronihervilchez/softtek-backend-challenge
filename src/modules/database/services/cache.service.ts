import { DynamoDBClient, ScanCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { CacheSchema } from "../schemas/database.schemas";
import { IPerson } from "../../../interfaces/fusionado.interface";
import { ICacheService } from "../interfaces/cache.interface";

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
   * Busca datos fusionados cacheados - retorna CacheSchema completo o null
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

      // Tomar el primer (y único) registro de fusionados
      const item = result.Items[0];

      console.log(`✅ Cache HIT - Datos fusionados encontrados`);

      // Si existe el item, todos los campos están presentes (garantizado por save)
      const cacheData: CacheSchema = {
        id: item.id.S!,
        fechaCreacion: item.fechaCreacion.S!,
        personas: JSON.parse(item.personas.S!) as IPerson[],
        ttl: parseInt(item.ttl.N!),
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

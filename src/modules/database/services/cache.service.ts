import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

/**
 * Servicio de cache simplificado usando DynamoDB con TTL de 30 minutos
 */
export class CacheService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;
  private readonly TTL_SECONDS = 1800; // 30 minutos

  constructor() {
    this.dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION ?? "us-east-1",
    });
    this.tableName = process.env.DYNAMODB_TABLE_CACHE ?? "softtek-cache";
  }

  /**
   * Guarda datos en el cache con TTL de 30 minutos
   */
  async save<T>(key: string, data: T): Promise<boolean> {
    try {
      const ttl = Math.floor(Date.now() / 1000) + this.TTL_SECONDS;

      const params = {
        TableName: this.tableName,
        Item: {
          cacheKey: { S: key },
          data: { S: JSON.stringify(data) },
          ttl: { N: ttl.toString() },
          createdAt: { N: Math.floor(Date.now() / 1000).toString() },
        },
      };

      const command = new PutItemCommand(params);
      await this.dynamoClient.send(command);

      console.log(`💾 Cache guardado para clave: ${key} (TTL: 30 minutos)`);
      return true;
    } catch (error) {
      console.error(`❌ Error guardando cache para clave ${key}:`, error);
      return false;
    }
  }

  /**
   * Busca datos en el cache
   */
  async find<T>(key: string): Promise<T | null> {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          cacheKey: { S: key },
        },
      };

      const command = new GetItemCommand(params);
      const result = await this.dynamoClient.send(command);

      if (!result.Item) {
        console.log(`� Cache MISS para clave: ${key}`);
        return null;
      }

      // Verificar si el TTL ha expirado
      const ttl = result.Item.ttl?.N ? parseInt(result.Item.ttl.N) : 0;
      const now = Math.floor(Date.now() / 1000);

      if (ttl > 0 && now > ttl) {
        console.log(`⏰ Cache EXPIRADO para clave: ${key}`);
        return null;
      }

      console.log(`✅ Cache HIT para clave: ${key}`);
      return result.Item.data?.S ? JSON.parse(result.Item.data.S) : null;
    } catch (error) {
      console.error(`❌ Error obteniendo cache para clave ${key}:`, error);
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

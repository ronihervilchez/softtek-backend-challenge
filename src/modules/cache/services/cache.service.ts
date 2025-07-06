import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBGetParams, DynamoDBPutParams, DynamoDBDeleteParams } from '../../../interfaces/dynamodb.interface';
import { CacheService, CacheConfig, CacheStats, CacheMetrics } from '../interfaces/cache.interface';

/**
 * Servicio de cache usando DynamoDB con TTL
 */
export class DynamoDBCacheService implements CacheService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;
  private readonly defaultTTL: number;
  private readonly stats: CacheStats;

  constructor(config?: Partial<CacheConfig>) {
    this.dynamoClient = new DynamoDBClient({
      region: config?.region ?? process.env.AWS_REGION ?? 'us-east-1',
    });
    this.tableName = config?.tableName ?? process.env.DYNAMODB_TABLE_CACHE ?? 'dev-softtek-cache';
    this.defaultTTL = config?.defaultTTL ?? 1800; // 30 minutos por defecto
    this.stats = {
      hits: 0,
      misses: 0,
      expired: 0,
      errors: 0,
    };
  }

  /**
   * Obtiene un valor del cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const params: DynamoDBGetParams = {
        TableName: this.tableName,
        Key: {
          cacheKey: { S: key }
        }
      };

      const command = new GetItemCommand(params);
      const result = await this.dynamoClient.send(command);

      if (!result.Item) {
        console.log(`🔍 Cache MISS para clave: ${key}`);
        this.stats.misses++;
        return null;
      }

      // Verificar si el TTL ha expirado (DynamoDB puede tardar en eliminar registros)
      const ttl = result.Item.ttl?.N ? parseInt(result.Item.ttl.N) : 0;
      const now = Math.floor(Date.now() / 1000);

      if (ttl > 0 && now > ttl) {
        // Cache expirado, eliminar y retornar null
        console.log(`⏰ Cache EXPIRADO para clave: ${key} (TTL: ${ttl}, Ahora: ${now})`);
        this.stats.expired++;
        await this.delete(key);
        return null;
      }

      const timeLeft = ttl - now;
      console.log(`✅ Cache HIT para clave: ${key} (Expira en ${timeLeft}s)`);
      this.stats.hits++;
      return result.Item.data?.S ? JSON.parse(result.Item.data.S) : null;
    } catch (error) {
      console.error(`❌ Error getting cache for key ${key}:`, error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Guarda un valor en el cache
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const ttl = Math.floor(Date.now() / 1000) + (ttlSeconds ?? this.defaultTTL);
      
      const params: DynamoDBPutParams = {
        TableName: this.tableName,
        Item: {
          cacheKey: { S: key },
          data: { S: JSON.stringify(value) },
          ttl: { N: ttl.toString() },
          createdAt: { N: Math.floor(Date.now() / 1000).toString() }
        }
      };

      const command = new PutItemCommand(params);
      await this.dynamoClient.send(command);
      
      const expirationTime = new Date(ttl * 1000).toISOString();
      console.log(`💾 Cache SET para clave: ${key} (TTL: ${ttlSeconds ?? this.defaultTTL}s, Expira: ${expirationTime})`);
      
      return true;
    } catch (error) {
      console.error(`❌ Error setting cache for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Elimina un valor del cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const params: DynamoDBDeleteParams = {
        TableName: this.tableName,
        Key: {
          cacheKey: { S: key }
        }
      };

      const command = new DeleteItemCommand(params);
      await this.dynamoClient.send(command);
      
      console.log(`🗑️ Cache DELETE para clave: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting cache for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Verifica si una clave existe en el cache
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Obtiene o establece un valor en el cache
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === null) {
      console.log(`🔄 Cache MISS - Obteniendo datos frescos para: ${key}`);
      value = await factory();
      await this.set(key, value, ttlSeconds);
      console.log(`✅ Datos frescos obtenidos y cacheados para: ${key}`);
    } else {
      console.log(`🎯 Cache HIT - Devolviendo datos cacheados para: ${key}`);
    }
    
    return value;
  }

  /**
   * Obtiene múltiples valores del cache
   */
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    
    // Procesar en paralelo
    const promises = keys.map(async (key) => {
      const value = await this.get<T>(key);
      return { key, value };
    });
    
    const results = await Promise.all(promises);
    
    for (const { key, value } of results) {
      result[key] = value;
    }
    
    return result;
  }

  /**
   * Genera una clave de cache con prefijo
   */
  generateKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Limpia las claves que coinciden con un patrón
   * Nota: DynamoDB no soporta wildcards nativamente
   */
  async clearPattern(_pattern: string): Promise<number> {
    // DynamoDB no soporta wildcards nativamente, así que usamos Query si el patrón es específico
    // Para implementación completa, se necesitaría Scan (costoso) o indexación adicional
    console.warn('clearPattern not fully implemented for DynamoDB - consider using specific keys');
    return 0;
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Obtiene métricas del cache
   */
  async getMetrics(): Promise<CacheMetrics> {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;

    return {
      totalKeys: 0, // Requiere scan para obtener el total
      totalSize: 0, // Requiere scan para obtener el tamaño
      hitRate,
      stats: this.getStats(),
    };
  }

  /**
   * Resetea las estadísticas
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.expired = 0;
    this.stats.errors = 0;
  }
}

// Singleton para reutilizar la instancia
let cacheServiceInstance: DynamoDBCacheService | null = null;

export const getCacheService = (): DynamoDBCacheService => {
  cacheServiceInstance ??= new DynamoDBCacheService();
  return cacheServiceInstance;
};

export { DynamoDBCacheService as CacheServiceImpl };

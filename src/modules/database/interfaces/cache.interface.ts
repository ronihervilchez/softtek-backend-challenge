import { IPerson } from "../../../interfaces/fusionado.interface";
import { CacheSchema } from "../schemas/database.schemas";

export interface CacheItem<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  expiresAt: number;
}

export interface CacheConfig {
  tableName: string;
  defaultTTL: number;
  region: string;
}

export interface ICacheService {
  saveFusionados(id: string, personas: IPerson[]): Promise<boolean>;
  findFusionados(): Promise<CacheSchema | null>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  expired: number;
  errors: number;
}

export interface CacheMetrics {
  totalKeys: number;
  totalSize: number;
  hitRate: number;
  stats: CacheStats;
}

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
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>;
  getMultiple<T>(keys: string[]): Promise<Record<string, T | null>>;
  generateKey(prefix: string, ...parts: string[]): string;
  clearPattern(pattern: string): Promise<number>;
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

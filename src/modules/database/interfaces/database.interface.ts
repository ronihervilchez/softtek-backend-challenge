export interface DatabaseRecord {
  id: string;
  categoria: string;
  fechaCreacion: string;
  nombre: string;
  datos: Record<string, any>;
  usuario: string;
  procesado: boolean;
  timestamp: number;
}

export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface DatabaseService {
  // Métodos CRUD básicos
  put(item: DatabaseRecord): Promise<DatabaseRecord>;
  get(id: string): Promise<DatabaseRecord | null>;
  query(categoria: string, fecha?: string): Promise<DatabaseRecord[]>;
  update(id: string, updates: Partial<DatabaseRecord>): Promise<DatabaseRecord>;
  delete(id: string): Promise<boolean>;
  
  // Métodos de búsqueda avanzada
  findByCategory(categoria: string, limit?: number): Promise<DatabaseRecord[]>;
  findByDateRange(startDate: string, endDate: string): Promise<DatabaseRecord[]>;
  findByUser(usuario: string): Promise<DatabaseRecord[]>;
  
  // Métodos de agregación
  countByCategory(categoria: string): Promise<number>;
  getLatestRecords(limit: number): Promise<DatabaseRecord[]>;
}

export interface DatabaseConfig {
  tableName: string;
  region: string;
  indexName?: string;
}

export interface QueryOptions {
  limit?: number;
  lastEvaluatedKey?: Record<string, any>;
  scanIndexForward?: boolean;
  filterExpression?: string;
  projectionExpression?: string;
}

export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
  count: number;
  scannedCount: number;
}

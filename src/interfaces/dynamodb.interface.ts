/**
 * Interfaces para DynamoDB
 */

export interface DynamoDBRecord {
  id: string;
  categoria: string;
  fechaCreacion: string;
  nombre: string;
  datos: Record<string, any>;
  usuario: string;
  procesado: boolean;
  timestamp: number;
}

export interface DynamoDBCacheRecord {
  cacheKey: string;
  data: Record<string, any>;
  ttl: number;
}

export interface DynamoDBQueryParams {
  TableName: string;
  KeyConditionExpression?: string;
  FilterExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, any>;
  IndexName?: string;
  Limit?: number;
  ScanIndexForward?: boolean;
}

export interface DynamoDBPutParams {
  TableName: string;
  Item: Record<string, any>;
  ConditionExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, any>;
}

export interface DynamoDBGetParams {
  TableName: string;
  Key: Record<string, any>;
  ProjectionExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
}

export interface DynamoDBUpdateParams {
  TableName: string;
  Key: Record<string, any>;
  UpdateExpression: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, any>;
  ConditionExpression?: string;
  ReturnValues?: 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW';
}

export interface DynamoDBDeleteParams {
  TableName: string;
  Key: Record<string, any>;
  ConditionExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, any>;
}

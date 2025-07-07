import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  DynamoDBDeleteParams,
  DynamoDBGetParams,
  DynamoDBPutParams,
  DynamoDBQueryParams,
  DynamoDBUpdateParams,
} from "../../../interfaces/dynamodb.interface";
import {
  DatabaseConfig,
  DatabaseRecord,
  DatabaseService,
  QueryOptions,
  QueryResult,
} from "../interfaces/database.interface";

export class DynamoDBService implements DatabaseService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;
  private readonly indexName: string;

  constructor(config?: Partial<DatabaseConfig>) {
    this.dynamoClient = new DynamoDBClient({
      region: config?.region ?? process.env.AWS_REGION ?? "us-east-1",
    });
    this.tableName = config?.tableName ?? process.env.DYNAMODB_TABLE_DATA ?? "dev-softtek-data";
    this.indexName = config?.indexName ?? "categoria-fecha-index";
  }

  /**
   * Guarda un registro en DynamoDB
   */
  async put(item: DatabaseRecord): Promise<DatabaseRecord> {
    try {
      const params: DynamoDBPutParams = {
        TableName: this.tableName,
        Item: marshall(item, {
          removeUndefinedValues: true,
          convertEmptyValues: true,
        }),
      };

      const command = new PutItemCommand(params);
      await this.dynamoClient.send(command);

      console.log(`💾 Registro guardado en DynamoDB: ${item.id}`);
      return item;
    } catch (error) {
      console.error(`❌ Error al guardar en DynamoDB:`, error);
      throw new Error(`Error al guardar en DynamoDB: ${error}`);
    }
  }

  /**
   * Obtiene un registro por ID
   */
  async get(id: string): Promise<DatabaseRecord | null> {
    try {
      const params: DynamoDBGetParams = {
        TableName: this.tableName,
        Key: marshall({ id }),
      };

      const command = new GetItemCommand(params);
      const result = await this.dynamoClient.send(command);

      if (!result.Item) {
        return null;
      }

      const record = unmarshall(result.Item) as DatabaseRecord;
      console.log(`📖 Registro obtenido de DynamoDB: ${record.id}`);
      return record;
    } catch (error) {
      console.error(`❌ Error al obtener de DynamoDB:`, error);
      throw new Error(`Error al obtener de DynamoDB: ${error}`);
    }
  }

  /**
   * Busca registros por categoría y opcionalmente por fecha
   */
  async query(categoria: string, fecha?: string): Promise<DatabaseRecord[]> {
    try {
      const params: DynamoDBQueryParams = {
        TableName: this.tableName,
        IndexName: this.indexName,
        KeyConditionExpression: fecha
          ? "categoria = :categoria AND fechaCreacion = :fecha"
          : "categoria = :categoria",
        ExpressionAttributeValues: marshall({
          ":categoria": categoria,
          ...(fecha && { ":fecha": fecha }),
        }),
      };

      const command = new QueryCommand(params);
      const result = await this.dynamoClient.send(command);

      const records = result.Items?.map((item) => unmarshall(item) as DatabaseRecord) ?? [];
      console.log(`🔍 Query ejecutada en DynamoDB: ${records.length} registros encontrados`);
      return records;
    } catch (error) {
      console.error(`❌ Error al consultar DynamoDB:`, error);
      throw new Error(`Error al consultar DynamoDB: ${error}`);
    }
  }

  /**
   * Actualiza un registro existente
   */
  async update(id: string, updates: Partial<DatabaseRecord>): Promise<DatabaseRecord> {
    try {
      // Construir la expresión de actualización dinámicamente
      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      Object.entries(updates).forEach(([key, value], index) => {
        if (key !== "id") {
          // No actualizar la clave primaria
          const attrName = `#attr${index}`;
          const attrValue = `:val${index}`;

          updateExpression.push(`${attrName} = ${attrValue}`);
          expressionAttributeNames[attrName] = key;
          expressionAttributeValues[attrValue] = value;
        }
      });

      const params: DynamoDBUpdateParams = {
        TableName: this.tableName,
        Key: marshall({ id }),
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ReturnValues: "ALL_NEW",
      };

      const command = new UpdateItemCommand(params);
      const result = await this.dynamoClient.send(command);

      const updatedRecord = result.Attributes
        ? (unmarshall(result.Attributes) as DatabaseRecord)
        : ({} as DatabaseRecord);
      console.log(`🔄 Registro actualizado en DynamoDB: ${id}`);
      return updatedRecord;
    } catch (error) {
      console.error(`❌ Error al actualizar en DynamoDB:`, error);
      throw new Error(`Error al actualizar en DynamoDB: ${error}`);
    }
  }

  /**
   * Elimina un registro
   */
  async delete(id: string): Promise<boolean> {
    try {
      const params: DynamoDBDeleteParams = {
        TableName: this.tableName,
        Key: marshall({ id }),
      };

      const command = new DeleteItemCommand(params);
      await this.dynamoClient.send(command);

      console.log(`🗑️ Registro eliminado de DynamoDB: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error al eliminar de DynamoDB:`, error);
      throw new Error(`Error al eliminar de DynamoDB: ${error}`);
    }
  }

  /**
   * Busca registros por categoría con opciones avanzadas
   */
  async findByCategory(categoria: string, limit?: number): Promise<DatabaseRecord[]> {
    try {
      const params: DynamoDBQueryParams = {
        TableName: this.tableName,
        IndexName: this.indexName,
        KeyConditionExpression: "categoria = :categoria",
        ExpressionAttributeValues: marshall({
          ":categoria": categoria,
        }),
        ...(limit && { Limit: limit }),
        ScanIndexForward: false, // Ordenar por fecha descendente
      };

      const command = new QueryCommand(params);
      const result = await this.dynamoClient.send(command);

      const records = result.Items?.map((item) => unmarshall(item) as DatabaseRecord) ?? [];
      console.log(`📂 Registros por categoría '${categoria}': ${records.length} encontrados`);
      return records;
    } catch (error) {
      console.error(`❌ Error al buscar por categoría:`, error);
      throw new Error(`Error al buscar por categoría: ${error}`);
    }
  }

  /**
   * Busca registros por rango de fechas
   */
  async findByDateRange(startDate: string, endDate: string): Promise<DatabaseRecord[]> {
    try {
      const params = {
        TableName: this.tableName,
        FilterExpression: "fechaCreacion BETWEEN :startDate AND :endDate",
        ExpressionAttributeValues: marshall({
          ":startDate": startDate,
          ":endDate": endDate,
        }),
      };

      const command = new ScanCommand(params);
      const result = await this.dynamoClient.send(command);

      const records = result.Items?.map((item) => unmarshall(item) as DatabaseRecord) ?? [];
      console.log(`📅 Registros por rango de fechas: ${records.length} encontrados`);
      return records;
    } catch (error) {
      console.error(`❌ Error al buscar por rango de fechas:`, error);
      throw new Error(`Error al buscar por rango de fechas: ${error}`);
    }
  }

  /**
   * Busca registros por usuario
   */
  async findByUser(usuario: string): Promise<DatabaseRecord[]> {
    try {
      const params = {
        TableName: this.tableName,
        FilterExpression: "usuario = :usuario",
        ExpressionAttributeValues: marshall({
          ":usuario": usuario,
        }),
      };

      const command = new ScanCommand(params);
      const result = await this.dynamoClient.send(command);

      const records = result.Items?.map((item) => unmarshall(item) as DatabaseRecord) ?? [];
      console.log(`👤 Registros por usuario '${usuario}': ${records.length} encontrados`);
      return records;
    } catch (error) {
      console.error(`❌ Error al buscar por usuario:`, error);
      throw new Error(`Error al buscar por usuario: ${error}`);
    }
  }

  /**
   * Cuenta registros por categoría
   */
  async countByCategory(categoria: string): Promise<number> {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: this.indexName,
        KeyConditionExpression: "categoria = :categoria",
        ExpressionAttributeValues: marshall({
          ":categoria": categoria,
        }),
        Select: "COUNT" as const,
      };

      const command = new QueryCommand(params);
      const result = await this.dynamoClient.send(command);

      const count = result.Count ?? 0;
      console.log(`🔢 Conteo por categoría '${categoria}': ${count} registros`);
      return count;
    } catch (error) {
      console.error(`❌ Error al contar por categoría:`, error);
      throw new Error(`Error al contar por categoría: ${error}`);
    }
  }

  /**
   * Obtiene los registros más recientes
   */
  async getLatestRecords(limit: number): Promise<DatabaseRecord[]> {
    try {
      const params = {
        TableName: this.tableName,
        Limit: limit,
        ScanIndexForward: false,
      };

      const command = new ScanCommand(params);
      const result = await this.dynamoClient.send(command);

      const records = result.Items?.map((item) => unmarshall(item) as DatabaseRecord) ?? [];

      // Ordenar por timestamp descendente
      records.sort((a, b) => b.timestamp - a.timestamp);

      console.log(`⏰ Registros más recientes: ${records.length} encontrados`);
      return records.slice(0, limit);
    } catch (error) {
      console.error(`❌ Error al obtener registros recientes:`, error);
      throw new Error(`Error al obtener registros recientes: ${error}`);
    }
  }

  /**
   * Ejecuta una consulta avanzada con opciones
   */
  async advancedQuery(categoria: string, options: QueryOptions = {}): Promise<QueryResult<DatabaseRecord>> {
    try {
      const params: DynamoDBQueryParams = {
        TableName: this.tableName,
        IndexName: this.indexName,
        KeyConditionExpression: "categoria = :categoria",
        ExpressionAttributeValues: marshall({
          ":categoria": categoria,
        }),
        ...(options.limit && { Limit: options.limit }),
        ...(options.lastEvaluatedKey && { ExclusiveStartKey: marshall(options.lastEvaluatedKey) }),
        ...(options.scanIndexForward !== undefined && { ScanIndexForward: options.scanIndexForward }),
        ...(options.filterExpression && { FilterExpression: options.filterExpression }),
        ...(options.projectionExpression && { ProjectionExpression: options.projectionExpression }),
      };

      const command = new QueryCommand(params);
      const result = await this.dynamoClient.send(command);

      const items = result.Items?.map((item) => unmarshall(item) as DatabaseRecord) ?? [];

      return {
        items,
        lastEvaluatedKey: result.LastEvaluatedKey ? unmarshall(result.LastEvaluatedKey) : undefined,
        count: result.Count ?? 0,
        scannedCount: result.ScannedCount ?? 0,
      };
    } catch (error) {
      console.error(`❌ Error en consulta avanzada:`, error);
      throw new Error(`Error en consulta avanzada: ${error}`);
    }
  }
}

// Singleton para reutilizar la instancia
let databaseServiceInstance: DynamoDBService | null = null;

export const getDatabaseService = (): DynamoDBService => {
  databaseServiceInstance ??= new DynamoDBService();
  return databaseServiceInstance;
};

export { DynamoDBService as DatabaseServiceImpl };

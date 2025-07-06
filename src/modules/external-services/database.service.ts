import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { 
  DynamoDBRecord, 
  DynamoDBGetParams, 
  DynamoDBPutParams, 
  DynamoDBUpdateParams, 
  DynamoDBDeleteParams, 
  DynamoDBQueryParams 
} from '../../interfaces/dynamodb.interface';

export interface DatabaseService {
  // Métodos específicos para DynamoDB
  put(item: DynamoDBRecord): Promise<DynamoDBRecord>;
  get(id: string): Promise<DynamoDBRecord | null>;
  query(categoria: string, fecha?: string): Promise<DynamoDBRecord[]>;
  update(id: string, updates: Partial<DynamoDBRecord>): Promise<DynamoDBRecord>;
  delete(id: string): Promise<boolean>;
  // Métodos compatibles con la interfaz anterior (deprecated)
  insert(table: string, data: Record<string, any>): Promise<Record<string, any>>;
  queryLegacy(sql: string, params?: any[]): Promise<any[]>;
}

export class DatabaseServiceImpl implements DatabaseService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
    });
    this.tableName = process.env.DYNAMODB_TABLE_DATA ?? 'dev-softtek-data';
  }

  /**
   * Guarda un registro en DynamoDB
   */
  async put(item: DynamoDBRecord): Promise<DynamoDBRecord> {
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
      
      return item;
    } catch (error) {
      throw new Error(`Error al guardar en DynamoDB: ${error}`);
    }
  }

  /**
   * Obtiene un registro por ID
   */
  async get(id: string): Promise<DynamoDBRecord | null> {
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

      return unmarshall(result.Item) as DynamoDBRecord;
    } catch (error) {
      throw new Error(`Error al obtener de DynamoDB: ${error}`);
    }
  }

  /**
   * Busca registros por categoría y opcionalmente por fecha
   */
  async query(categoria: string, fecha?: string): Promise<DynamoDBRecord[]> {
    try {
      const params: DynamoDBQueryParams = {
        TableName: this.tableName,
        IndexName: 'categoria-fecha-index',
        KeyConditionExpression: fecha 
          ? 'categoria = :categoria AND fechaCreacion = :fecha'
          : 'categoria = :categoria',
        ExpressionAttributeValues: marshall({
          ':categoria': categoria,
          ...(fecha && { ':fecha': fecha })
        }),
      };

      const command = new QueryCommand(params);
      const result = await this.dynamoClient.send(command);

      return result.Items?.map(item => unmarshall(item) as DynamoDBRecord) ?? [];
    } catch (error) {
      throw new Error(`Error al consultar DynamoDB: ${error}`);
    }
  }

  /**
   * Actualiza un registro existente
   */
  async update(id: string, updates: Partial<DynamoDBRecord>): Promise<DynamoDBRecord> {
    try {
      // Construir la expresión de actualización dinámicamente
      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      Object.entries(updates).forEach(([key, value], index) => {
        if (key !== 'id') { // No actualizar la clave primaria
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
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ReturnValues: 'ALL_NEW',
      };

      const command = new UpdateItemCommand(params);
      const result = await this.dynamoClient.send(command);

      return result.Attributes ? unmarshall(result.Attributes) as DynamoDBRecord : {} as DynamoDBRecord;
    } catch (error) {
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
      
      return true;
    } catch (error) {
      throw new Error(`Error al eliminar de DynamoDB: ${error}`);
    }
  }

  // Métodos para compatibilidad con la interfaz anterior
  
  /**
   * @deprecated Usar put() en su lugar
   */
  async insert(table: string, data: Record<string, any>): Promise<Record<string, any>> {
    console.warn('DatabaseService.insert() is deprecated. Use put() instead.');
    
    // Mapear a la nueva estructura si es posible
    const record: DynamoDBRecord = {
      id: data.id ?? Date.now().toString(),
      categoria: data.categoria ?? 'general',
      fechaCreacion: data.fechaCreacion ?? new Date().toISOString(),
      nombre: data.nombre ?? 'Sin nombre',
      datos: data.datos ?? data,
      usuario: data.usuario ?? 'sistema',
      procesado: data.procesado ?? false,
      timestamp: data.timestamp ?? Date.now(),
    };

    return await this.put(record);
  }

  /**
   * @deprecated Usar query() en su lugar
   */
  async queryLegacy(_sql: string, _params?: any[]): Promise<any[]> {
    console.warn('DatabaseService.queryLegacy() is deprecated. Use query() instead.');
    // Para compatibilidad, retornar array vacío
    return [];
  }
}

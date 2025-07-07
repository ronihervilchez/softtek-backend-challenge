import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { AlmacenarDto } from '../dtos/almacenar.dto';
import { UsuariosSchema } from '../../database/schemas';

export interface AlmacenarService {
  almacenar(data: AlmacenarDto): Promise<UsuariosSchema>;
  saveUsuario(usuarioData: UsuariosSchema): Promise<boolean>;
  getUsuario(usuario: string): Promise<UsuariosSchema | null>;
}

export class AlmacenarServiceImpl implements AlmacenarService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION ?? "us-east-1",
    });
    this.tableName = process.env.DYNAMODB_TABLE_USUARIOS ?? "softtek-usuarios";
  }

  /**
   * Almacena datos de usuario (función principal del endpoint)
   */
  async almacenar(data: AlmacenarDto): Promise<UsuariosSchema> {
    try {
      console.log('👤 Almacenando datos de usuario...');
      
      // Crear el schema de usuario
      const usuarioData: UsuariosSchema = {
        usuario: data.usuario,
        fechaCreacion: new Date().toISOString(),
        nombres: data.nombres,
        apellidos: data.apellidos,
        fechaNacimiento: data.fechaNacimiento,
        telefono: data.telefono,
      };

      // Guardar en la tabla de usuarios
      const success = await this.saveUsuario(usuarioData);

      if (success) {
        console.log(`✅ Usuario guardado exitosamente: ${data.usuario}`);
        return usuarioData;
      } else {
        console.log(`❌ Error guardando usuario: ${data.usuario}`);
        throw new Error('Error al almacenar usuario en la base de datos');
      }
    } catch (error) {
      console.error('❌ Error en el servicio de almacenar:', error);
      throw new Error(`Error al almacenar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Guarda datos de usuario en DynamoDB
   */
  async saveUsuario(usuarioData: UsuariosSchema): Promise<boolean> {
    try {
      const params = {
        TableName: this.tableName,
        Item: {
          usuario: { S: usuarioData.usuario },
          fechaCreacion: { S: usuarioData.fechaCreacion },
          nombres: { S: usuarioData.nombres },
          apellidos: { S: usuarioData.apellidos },
          fechaNacimiento: { S: usuarioData.fechaNacimiento },
          telefono: { S: usuarioData.telefono },
        },
      };

      const command = new PutItemCommand(params);
      await this.dynamoClient.send(command);

      console.log(`👤 Usuario guardado: ${usuarioData.usuario}`);
      return true;
    } catch (error) {
      console.error(`❌ Error guardando usuario:`, error);
      return false;
    }
  }

  /**
   * Obtiene datos de un usuario por ID
   */
  async getUsuario(usuario: string): Promise<UsuariosSchema | null> {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          usuario: { S: usuario },
        },
      };

      const command = new GetItemCommand(params);
      const result = await this.dynamoClient.send(command);

      if (!result?.Item) {
        console.log(`🔍 Usuario no encontrado: ${usuario}`);
        return null;
      }

      const userData: UsuariosSchema = {
        usuario: result.Item.usuario.S!,
        fechaCreacion: result.Item.fechaCreacion.S!,
        nombres: result.Item.nombres.S!,
        apellidos: result.Item.apellidos.S!,
        fechaNacimiento: result.Item.fechaNacimiento.S!,
        telefono: result.Item.telefono.S!,
      };

      console.log(`✅ Usuario encontrado: ${usuario}`);
      return userData;
    } catch (error) {
      console.error(`❌ Error obteniendo usuario:`, error);
      return null;
    }
  }
}

// Singleton para reutilizar la instancia
let almacenarServiceInstance: AlmacenarServiceImpl | null = null;

export const getAlmacenarService = (): AlmacenarServiceImpl => {
  almacenarServiceInstance ??= new AlmacenarServiceImpl();
  return almacenarServiceInstance;
};

// Exportar instancia singleton (mantener compatibilidad)
export const almacenarService = getAlmacenarService();

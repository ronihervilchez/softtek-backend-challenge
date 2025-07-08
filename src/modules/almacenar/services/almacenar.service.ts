import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { AlmacenarDto } from '../dtos/almacenar.dto';
import { UsuariosSchema } from '../../database/schemas/database.schemas';
import { CognitoUserManager } from '../../external-services/cognito-user-manager.service';

export interface AlmacenarService {
  almacenar(data: AlmacenarDto): Promise<UsuariosSchema>;
  saveUsuario(usuarioData: UsuariosSchema): Promise<boolean>;
  updateUsuario(usuarioData: UsuariosSchema): Promise<boolean>;
  getUsuario(usuario: string): Promise<UsuariosSchema | null>;
}

export class AlmacenarServiceImpl implements AlmacenarService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;
  private readonly cognitoUserManager: CognitoUserManager;

  constructor() {
    this.dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION ?? "us-east-1",
    });
    this.tableName = process.env.DYNAMODB_TABLE_USUARIOS ?? "softtek-usuarios";
    this.cognitoUserManager = new CognitoUserManager();
  }

  /**
   * Almacena datos de usuario (solo actualiza usuarios existentes)
   */
  async almacenar(data: AlmacenarDto): Promise<UsuariosSchema> {
    try {
      console.log('👤 Actualizando datos de usuario existente...');

      // 1. Verificar que el usuario existe
      const usuarioExistente = await this.getUsuario(data.usuario);

      if (!usuarioExistente) {
        console.log(`❌ Usuario no encontrado: ${data.usuario}`);
        throw new Error(`Usuario ${data.usuario} no existe. Use el endpoint de registro para crear nuevos usuarios.`);
      }

      // 2. Verificar si cambió el nombre o apellidos para sincronizar con Cognito
      const nombresCambiaron = usuarioExistente.nombres !== data.nombres || usuarioExistente.apellidos !== data.apellidos;

      if (nombresCambiaron) {
        console.log(`🔄 Sincronizando cambios de nombre/apellidos con Cognito para: ${data.usuario}`);
        try {
          await this.cognitoUserManager.updateUserAttributes(data.usuario, data.nombres, data.apellidos);
          console.log(`✅ Nombre actualizado en Cognito: ${data.nombres} ${data.apellidos}`);
        } catch (cognitoError) {
          console.error(`⚠️ Error actualizando Cognito (continuando con DynamoDB):`, cognitoError);
          // No lanzamos error aquí para que continúe con la actualización de DynamoDB
        }
      }

      // 3. Crear el schema actualizado manteniendo la fecha de creación original
      const usuarioActualizado: UsuariosSchema = {
        usuario: data.usuario,
        fechaCreacion: usuarioExistente.fechaCreacion, // Mantener fecha original
        nombres: data.nombres,
        apellidos: data.apellidos,
        fechaNacimiento: data.fechaNacimiento,
        telefono: data.telefono,
      };

      // 4. Actualizar en DynamoDB
      const success = await this.updateUsuario(usuarioActualizado);

      if (success) {
        console.log(`✅ Usuario actualizado exitosamente: ${data.usuario}`);
        return usuarioActualizado;
      } else {
        console.log(`❌ Error actualizando usuario: ${data.usuario}`);
        throw new Error('Error al actualizar usuario en la base de datos');
      }
    } catch (error) {
      console.error('❌ Error en el servicio de almacenar:', error);
      throw new Error(`Error al actualizar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
   * Actualiza datos de usuario existente en DynamoDB
   */
  async updateUsuario(usuarioData: UsuariosSchema): Promise<boolean> {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          usuario: { S: usuarioData.usuario },
        },
        UpdateExpression: "SET nombres = :nombres, apellidos = :apellidos, fechaNacimiento = :fechaNacimiento, telefono = :telefono",
        ExpressionAttributeValues: {
          ":nombres": { S: usuarioData.nombres },
          ":apellidos": { S: usuarioData.apellidos },
          ":fechaNacimiento": { S: usuarioData.fechaNacimiento },
          ":telefono": { S: usuarioData.telefono },
        },
      };

      const command = new UpdateItemCommand(params);
      await this.dynamoClient.send(command);

      console.log(`🔄 Usuario actualizado: ${usuarioData.usuario}`);
      return true;
    } catch (error) {
      console.error(`❌ Error actualizando usuario:`, error);
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

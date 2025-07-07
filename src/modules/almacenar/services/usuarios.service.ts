import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { UsuariosSchema } from "../../database/schemas";

/**
 * Servicio para manejar datos de usuarios
 */
export class UsuariosService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION ?? "us-east-1",
    });
    this.tableName = process.env.DYNAMODB_TABLE_USUARIOS ?? "softtek-usuarios";
  }

  /**
   * Guarda datos de usuario
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
let usuariosServiceInstance: UsuariosService | null = null;

export const getUsuariosService = (): UsuariosService => {
  usuariosServiceInstance ??= new UsuariosService();
  return usuariosServiceInstance;
};

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { RegistroUsuarioDto } from '../dtos/registro.dto';
import { UsuariosSchema } from '../../database/schemas/database.schemas';
import { CognitoUserManager } from '../../external-services/cognito-user-manager.service';

export interface UsuarioRegistroService {
  registrarUsuario(data: RegistroUsuarioDto): Promise<{ cognito: any; dynamodb: UsuariosSchema }>;
}

export class UsuarioRegistroServiceImpl implements UsuarioRegistroService {
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
   * Registra un usuario completo (Cognito + DynamoDB)
   */
  async registrarUsuario(data: RegistroUsuarioDto): Promise<{ cognito: any; dynamodb: UsuariosSchema }> {
    try {
      console.log('🔐 Registrando usuario en Cognito y DynamoDB...');

      // 1. Crear usuario en Cognito
      const cognitoResult = await this.cognitoUserManager.createUser(
        data.email,
        `${data.nombres} ${data.apellidos}`,
        data.password,
        ['users'] // Grupo por defecto
      );

      // 2. Crear datos para DynamoDB
      const usuarioData: UsuariosSchema = {
        usuario: data.email, // Usar email como ID único
        fechaCreacion: new Date().toISOString(),
        nombres: data.nombres,
        apellidos: data.apellidos,
        fechaNacimiento: data.fechaNacimiento,
        telefono: data.telefono,
      };

      // 3. Guardar en DynamoDB
      const dynamoSuccess = await this.saveUsuario(usuarioData);

      if (!dynamoSuccess) {
        // Si DynamoDB falla, consideramos eliminar el usuario de Cognito
        // (en un escenario real implementarías rollback)
        console.error('❌ Falló guardar en DynamoDB, usuario creado en Cognito');
        throw new Error('Error al guardar datos del usuario en DynamoDB');
      }

      console.log(`✅ Usuario registrado exitosamente: ${data.email}`);
      return {
        cognito: cognitoResult,
        dynamodb: usuarioData
      };
    } catch (error) {
      console.error('❌ Error en registro de usuario:', error);
      throw new Error(`Error al registrar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Guarda datos de usuario en DynamoDB
   */
  private async saveUsuario(usuarioData: UsuariosSchema): Promise<boolean> {
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

      console.log(`👤 Usuario guardado en DynamoDB: ${usuarioData.usuario}`);
      return true;
    } catch (error) {
      console.error(`❌ Error guardando usuario:`, error);
      return false;
    }
  }
}

// Singleton para reutilizar la instancia
let usuarioRegistroServiceInstance: UsuarioRegistroServiceImpl | null = null;

export const getUsuarioRegistroService = (): UsuarioRegistroServiceImpl => {
  usuarioRegistroServiceInstance ??= new UsuarioRegistroServiceImpl();
  return usuarioRegistroServiceInstance;
};

// Exportar instancia singleton
export const usuarioRegistroService = getUsuarioRegistroService();

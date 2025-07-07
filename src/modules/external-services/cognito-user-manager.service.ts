import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

export class CognitoUserManager {
  private readonly client: CognitoIdentityProviderClient;
  private readonly userPoolId: string;

  constructor(region: string = "us-east-1", userPoolId?: string) {
    this.client = new CognitoIdentityProviderClient({ region });
    this.userPoolId = userPoolId ?? process.env.COGNITO_USER_POOL_ID ?? "";
  }

  async createUser(
    email: string,
    name: string,
    temporaryPassword: string,
    groups: string[] = []
  ): Promise<any> {
    try {
      // Crear usuario
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: "email",
            Value: email,
          },
          {
            Name: "name",
            Value: name,
          },
          {
            Name: "email_verified",
            Value: "true",
          },
        ],
        TemporaryPassword: temporaryPassword,
        MessageAction: "SUPPRESS", // No enviar email de bienvenida
      });

      const createResult = await this.client.send(createUserCommand);

      // Establecer contraseña permanente
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        Password: temporaryPassword,
        Permanent: true,
      });

      await this.client.send(setPasswordCommand);

      // Agregar usuario a grupos
      for (const group of groups) {
        const addToGroupCommand = new AdminAddUserToGroupCommand({
          UserPoolId: this.userPoolId,
          Username: email,
          GroupName: group,
        });

        await this.client.send(addToGroupCommand);
      }

      return {
        success: true,
        user: createResult.User,
        message: "Usuario creado exitosamente",
      };
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error}`);
    }
  }

  async getUser(email: string): Promise<any> {
    try {
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      });

      const result = await this.client.send(getUserCommand);
      return result;
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error}`);
    }
  }

  async updateUserAttributes(
    email: string,
    nombres: string,
    apellidos: string
  ): Promise<any> {
    try {
      const updateUserCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: "name",
            Value: `${nombres} ${apellidos}`,
          },
        ],
      });

      await this.client.send(updateUserCommand);

      return {
        success: true,
        message: "Atributos de usuario actualizados exitosamente",
      };
    } catch (error) {
      throw new Error(`Error al actualizar atributos de usuario: ${error}`);
    }
  }
}

// Script para crear usuarios de prueba
export async function createTestUsers() {
  const userManager = new CognitoUserManager();

  try {
    // Crear usuario administrador
    await userManager.createUser("admin@softtek.com", "Administrador", "TempPass123!", ["admin"]);

    // Crear usuario normal
    await userManager.createUser("user@softtek.com", "Usuario Normal", "TempPass123!", ["users"]);

    // Crear usuario con permisos de escritura
    await userManager.createUser("writer@softtek.com", "Usuario Escritor", "TempPass123!", ["writers"]);

    console.log("Usuarios de prueba creados exitosamente");
    console.log("Usuarios disponibles:");
    console.log("- admin@softtek.com (admin) - Contraseña: TempPass123!");
    console.log("- user@softtek.com (users) - Contraseña: TempPass123!");
    console.log("- writer@softtek.com (writers) - Contraseña: TempPass123!");
  } catch (error) {
    console.error("Error creando usuarios de prueba:", error);
  }
}

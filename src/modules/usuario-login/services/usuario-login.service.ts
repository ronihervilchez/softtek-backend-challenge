import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput
} from '@aws-sdk/client-cognito-identity-provider';

export interface LoginService {
  login(email: string, password: string): Promise<LoginResponse>;
}

export interface LoginResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  usuario: string;
}

export class LoginServiceImpl implements LoginService {
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolClientId: string;

  constructor() {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION ?? 'us-east-1'
    });
    this.userPoolClientId = process.env.COGNITO_USER_POOL_CLIENT_ID ?? '';

    if (!this.userPoolClientId) {
      console.warn('⚠️ COGNITO_USER_POOL_CLIENT_ID no está configurado');
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log(`🔑 Intentando login para usuario: ${email}`);

      if (!this.userPoolClientId) {
        throw new Error('Configuración de Cognito no disponible');
      }

      const authParams: InitiateAuthCommandInput = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.userPoolClientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      };

      const command = new InitiateAuthCommand(authParams);
      const response = await this.cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Error en autenticación: No se recibió token');
      }

      console.log(`✅ Login exitoso para usuario: ${email}`);

      return {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        refreshToken: response.AuthenticationResult.RefreshToken!,
        expiresIn: response.AuthenticationResult.ExpiresIn!,
        usuario: email,
      };

    } catch (error: any) {
      console.error('❌ Error en login:', error);

      // Manejo específico de errores de Cognito
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Email o contraseña incorrectos');
      }
      if (error.name === 'UserNotFoundException') {
        throw new Error('Usuario no encontrado');
      }
      if (error.name === 'UserNotConfirmedException') {
        throw new Error('Usuario no confirmado. Por favor confirma tu cuenta');
      }
      if (error.name === 'InvalidParameterException') {
        throw new Error('Parámetros de login inválidos');
      }
      if (error.name === 'TooManyRequestsException') {
        throw new Error('Demasiados intentos de login. Intenta más tarde');
      }

      throw new Error(`Error en login: ${error.message}`);
    }
  }
}

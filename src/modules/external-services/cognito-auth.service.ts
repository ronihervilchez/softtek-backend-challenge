import { ResponseUtil } from '../../utils/response.util';

export interface CognitoAuthService {
  validateToken(token: string): Promise<any>;
  extractUserFromEvent(event: any): any;
  checkUserPermissions(user: any, resource: string, action: string): boolean;
}

export class CognitoAuthServiceImpl implements CognitoAuthService {
  
  async validateToken(token: string): Promise<any> {
    try {
      // En AWS Lambda, el token ya viene validado por API Gateway
      // Aquí puedes hacer validaciones adicionales si es necesario
      if (!token) {
        throw new Error('Token no proporcionado');
      }
      
      // Token válido (API Gateway ya lo validó)
      return { valid: true, token };
    } catch (error) {
      throw new Error(`Error al validar token: ${error}`);
    }
  }

  extractUserFromEvent(event: any): any {
    try {
      // Extraer información del usuario desde el evento de API Gateway
      const requestContext = event.requestContext;
      const authorizer = requestContext?.authorizer;
      
      if (!authorizer) {
        return null;
      }

      // Información del usuario desde Cognito
      const user = {
        userId: authorizer.claims?.sub ?? authorizer.principalId,
        email: authorizer.claims?.email,
        name: authorizer.claims?.name,
        groups: authorizer.claims?.['cognito:groups'] ?? [],
        username: authorizer.claims?.['cognito:username'],
        tokenUse: authorizer.claims?.token_use,
        scope: authorizer.claims?.scope,
        clientId: authorizer.claims?.client_id,
        iss: authorizer.claims?.iss,
        exp: authorizer.claims?.exp,
        iat: authorizer.claims?.iat,
      };

      return user;
    } catch (error) {
      console.error('Error extrayendo usuario del evento:', error);
      return null;
    }
  }

  checkUserPermissions(user: any, resource: string, action: string): boolean {
    try {
      if (!user) {
        return false;
      }

      // Lógica básica de permisos
      // Puedes personalizar esto según tus necesidades
      const userGroups = user.groups ?? [];
      
      // Administradores tienen acceso total
      if (userGroups.includes('admin')) {
        return true;
      }

      // Usuarios normales tienen acceso de lectura
      if (userGroups.includes('users') && action === 'read') {
        return true;
      }

      // Usuarios con permisos de escritura
      if (userGroups.includes('writers') && ['read', 'write'].includes(action)) {
        return true;
      }

      // Por defecto, permitir acceso (ajustar según necesidades)
      return true;
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
  }
}

// Middleware para autenticación
export const withAuth = (handler: any) => {
  return async (event: any, context: any) => {
    try {
      const authService = new CognitoAuthServiceImpl();
      
      // Extraer usuario del evento
      const user = authService.extractUserFromEvent(event);
      
      if (!user) {
        const errorResponse = ResponseUtil.error(
          ['Usuario no autenticado'],
          'Acceso denegado'
        );
        return ResponseUtil.lambdaResponse(401, errorResponse);
      }

      // Agregar usuario al evento para uso en el handler
      event.user = user;
      
      // Ejecutar el handler original
      return await handler(event, context);
    } catch (error) {
      const errorResponse = ResponseUtil.error(
        [error instanceof Error ? error.message : 'Error de autenticación'],
        'Error de autenticación'
      );
      return ResponseUtil.lambdaResponse(401, errorResponse);
    }
  };
};

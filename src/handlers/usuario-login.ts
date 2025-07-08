import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler as usuarioLoginController } from '../modules/usuario-login/controllers/usuario-login.controller';

/**
 * Handler de AWS Lambda para login de usuarios
 * Punto de entrada que delega al controller específico
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await usuarioLoginController(event, context);
};

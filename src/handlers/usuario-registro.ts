import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler as usuarioRegistroController } from '../modules/usuario-registro/controllers/usuario-registro.controller';

/**
 * Handler de AWS Lambda para registro de usuarios
 * Punto de entrada que delega al controller específico
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await usuarioRegistroController(event, context);
};

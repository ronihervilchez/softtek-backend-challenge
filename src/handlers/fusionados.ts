import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler as fusionadosController } from '../modules/fusionados/controllers/fusionados.controller';

/**
 * Handler de AWS Lambda para datos fusionados
 * Punto de entrada que delega al controller específico
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await fusionadosController(event, context);
};

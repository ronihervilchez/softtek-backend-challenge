import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler as almacenarController } from '../modules/almacenar/controllers/almacenar.controller';

/**
 * Handler de AWS Lambda para almacenar datos
 * Punto de entrada que delega al controller específico
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await almacenarController(event, context);
};

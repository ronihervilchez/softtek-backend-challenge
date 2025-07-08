import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler as historialController } from '../modules/historial/controllers/historial.controller';

/**
 * Handler de AWS Lambda para historial
 * Punto de entrada que delega al controller específico
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await historialController(event, context);
};

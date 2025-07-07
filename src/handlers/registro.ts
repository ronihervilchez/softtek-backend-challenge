import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AlmacenarController } from '../modules/almacenar/controllers/almacenar.controller';

// Instancia del controlador
const almacenarController = new AlmacenarController();

// Handler específico para registro de usuario
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return almacenarController.registrarUsuario(event, context);
};

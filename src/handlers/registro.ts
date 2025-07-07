import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { UsuarioRegistroController } from '../modules/usuario-registro/controllers/usuario-registro.controller';

// Instancia del controlador
const usuarioRegistroController = new UsuarioRegistroController();

// Handler específico para registro de usuario
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return usuarioRegistroController.registrar(event, context);
};

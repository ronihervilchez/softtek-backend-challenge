import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { UsuarioRegistroService, UsuarioRegistroServiceImpl } from '../services/usuario-registro.service';
import { RegistroUsuarioDto } from '../dtos/registro.dto';
import { ResponseUtil } from '../../../utils/response.util';
import { ValidationUtil } from '../../../utils/validation.util';

export class UsuarioRegistroController {
  private readonly usuarioRegistroService: UsuarioRegistroService;

  constructor(usuarioRegistroService?: UsuarioRegistroService) {
    this.usuarioRegistroService = usuarioRegistroService || new UsuarioRegistroServiceImpl();
  }

  async registrar(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('🔐 Iniciando registro de usuario (Cognito + DynamoDB)...');

      // Parsear el body de la request
      const body = event.body ? JSON.parse(event.body) : {};

      // Validar el DTO
      const validation = await ValidationUtil.validateDto(RegistroUsuarioDto, body);

      if (!validation.isValid) {
        console.log('❌ Datos de registro inválidos:', validation.errors);
        return ResponseUtil.lambdaResponse(400, ResponseUtil.error(
          validation.errors,
          'Datos de registro inválidos'
        ));
      }

      // Registrar usuario usando el servicio
      const resultado = await this.usuarioRegistroService.registrarUsuario(validation.dto as RegistroUsuarioDto);

      console.log(`✅ Usuario registrado exitosamente: ${resultado.dynamodb.usuario}`);

      return ResponseUtil.lambdaResponse(201, ResponseUtil.success(
        {
          usuario: resultado.dynamodb,
          mensaje: 'Usuario registrado exitosamente en Cognito y DynamoDB',
          loginInfo: {
            email: resultado.dynamodb.usuario,
            message: 'Usuario listo para iniciar sesión'
          }
        },
        'Usuario registrado exitosamente'
      ));
    } catch (error) {
      console.error('❌ Error al registrar usuario:', error);
      return ResponseUtil.lambdaResponse(500, ResponseUtil.error(
        [error instanceof Error ? error.message : 'Error desconocido'],
        'Error al registrar usuario'
      ));
    }
  }
}

// Instancia del controlador
const usuarioRegistroController = new UsuarioRegistroController();

// Handler para Lambda
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return usuarioRegistroController.registrar(event, context);
};

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AlmacenarService, AlmacenarServiceImpl } from '../services/almacenar.service';
import { AlmacenarDto, RegistroUsuarioDto } from '../dtos/almacenar.dto';
import { ResponseUtil } from '../../../utils/response.util';
import { ValidationUtil } from '../../../utils/validation.util';

export class AlmacenarController {
  private readonly almacenarService: AlmacenarService;

  constructor(almacenarService?: AlmacenarService) {
    this.almacenarService = almacenarService || new AlmacenarServiceImpl();
  }

  async almacenar(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('📥 Iniciando proceso de almacenamiento de datos...');

      // Parsear el body de la request
      const body = event.body ? JSON.parse(event.body) : {};

      // Validar el DTO
      const validation = await ValidationUtil.validateDto(AlmacenarDto, body);

      if (!validation.isValid) {
        console.log('❌ Datos de entrada inválidos:', validation.errors);
        return ResponseUtil.lambdaResponse(400, ResponseUtil.error(
          validation.errors,
          'Datos de entrada inválidos'
        ));
      }

      // Procesar los datos usando el servicio
      const usuarioGuardado = await this.almacenarService.almacenar(validation.dto as AlmacenarDto);

      console.log(`✅ Usuario almacenado exitosamente: ${usuarioGuardado.usuario}`);

      return ResponseUtil.lambdaResponse(201, ResponseUtil.success(usuarioGuardado, 'Usuario almacenado exitosamente'));
    } catch (error) {
      console.error('❌ Error al almacenar datos:', error);
      return ResponseUtil.lambdaResponse(500, ResponseUtil.error(
        [error instanceof Error ? error.message : 'Error desconocido'],
        'Error al almacenar datos'
      ));
    }
  }

  async registrarUsuario(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
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
      const resultado = await this.almacenarService.registrarUsuario(validation.dto as RegistroUsuarioDto);

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
const almacenarController = new AlmacenarController();

// Handler para Lambda
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return almacenarController.almacenar(event, context);
};

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { ResponseUtil } from "../../../utils/response.util";
import { ValidationUtil } from "../../../utils/validation.util";
import { LoginDto } from "../dtos/login.dto";
import { LoginService, LoginServiceImpl } from "../services/usuario-login.service";

export class UsuarioLoginController {
  private readonly loginService: LoginService;

  constructor(loginService?: LoginService) {
    this.loginService = loginService || new LoginServiceImpl();
  }

  async login(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log("🔑 Iniciando proceso de login...");
      console.log(`📋 Request ID: ${context.awsRequestId}`);

      // Parsear el body de la request
      const body = event.body ? JSON.parse(event.body) : {};

      // Validar el DTO
      const validation = await ValidationUtil.validateDto(LoginDto, body);

      if (!validation.isValid) {
        console.log("❌ Datos de login inválidos:", validation.errors);
        return ResponseUtil.lambdaResponse(
          400,
          ResponseUtil.error(validation.errors, "Datos de login inválidos")
        );
      }

      const loginDto = validation.dto as LoginDto;

      // Intentar login con Cognito
      const loginResponse = await this.loginService.login(loginDto.email, loginDto.password);

      console.log(`✅ Login exitoso para usuario: ${loginResponse.usuario}`);

      // Respuesta con tokens para el frontend
      return ResponseUtil.lambdaResponse(
        200,
        ResponseUtil.success(
          {
            token: loginResponse.accessToken, // Token principal para Authorization header
            idToken: loginResponse.idToken, // Token de identidad
            refreshToken: loginResponse.refreshToken, // Token para renovar sesión
            expiresIn: loginResponse.expiresIn, // Tiempo de expiración en segundos
            usuario: loginResponse.usuario, // Email del usuario
            type: "Bearer", // Tipo de token
          },
          "Login exitoso"
        )
      );
    } catch (error: any) {
      console.error("❌ Error en login:", error.message);

      // Retornar 401 para errores de autenticación específicos
      if (
        error.message.includes("incorrectos") ||
        error.message.includes("no encontrado") ||
        error.message.includes("no confirmado") ||
        error.message.includes("Demasiados intentos")
      ) {
        return ResponseUtil.lambdaResponse(
          401,
          ResponseUtil.error([error.message], "Error de autenticación")
        );
      }

      // Retornar 400 para errores de configuración
      if (error.message.includes("Configuración") || error.message.includes("inválidos")) {
        return ResponseUtil.lambdaResponse(400, ResponseUtil.error([error.message], "Error en la solicitud"));
      }

      // Error genérico del servidor
      return ResponseUtil.lambdaResponse(
        500,
        ResponseUtil.error(["Error interno del servidor durante el login"], "Error interno del servidor")
      );
    }
  }
}

// Instancia del controlador para reutilización
const usuarioLoginController = new UsuarioLoginController();

// Handler principal para AWS Lambda
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return usuarioLoginController.login(event, context);
};

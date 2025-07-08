import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent, Context } from "aws-lambda";
import { CognitoAuthorizerService } from "../modules/auth/services/cognito-authorizer.service";

/**
 * Lambda Authorizer personalizado para validar tokens de Cognito
 * Este authorizer reemplaza al CognitoUserPoolsAuthorizer de API Gateway
 */
export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context
): Promise<APIGatewayAuthorizerResult> => {
  console.log("🔐 Lambda Authorizer ejecutándose...");
  console.log("📋 Method ARN:", event.methodArn);
  console.log("🎟️ Authorization Token:", event.authorizationToken ? "Presente" : "Ausente");

  const authorizerService = new CognitoAuthorizerService();

  try {
    // Extraer el token del header Authorization
    const token = event.authorizationToken;

    if (!token) {
      console.log("❌ No se encontró token de autorización");
      throw new Error("Unauthorized");
    }

    // Validar el token con Cognito
    const authResult = await authorizerService.validateToken(token);

    console.log("✅ Token válido para usuario:", authResult.username);

    // Generar policy de acceso permitido para toda la API (usando wildcard)
    const apiArn = event.methodArn.split('/').slice(0, 2).join('/') + '/*';
    console.log("🔓 Generando policy para ARN:", apiArn);
    
    const policy = generatePolicy(authResult.username, "Allow", apiArn, authResult.claims);

    return policy;
  } catch (error) {
    console.error("❌ Error en autorización:", error);

    // Generar policy de acceso denegado para toda la API
    const apiArn = event.methodArn.split('/').slice(0, 2).join('/') + '/*';
    const policy = generatePolicy("user", "Deny", apiArn);
    return policy;
  }
};

/**
 * Genera la política de autorización para API Gateway
 */
function generatePolicy(
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  context?: any
): APIGatewayAuthorizerResult {
  console.log(`📋 Generando policy: ${effect} para resource: ${resource}`);
  
  const policy: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };

  // Agregar contexto del usuario para que esté disponible en las Lambdas
  if (context && effect === "Allow") {
    policy.context = {
      email: context.email ?? "",
      username: context.username ?? "",
      userId: context.sub ?? "",
      givenName: context.given_name ?? "",
      // Agregar cualquier otro claim que necesites
    };
    
    console.log("👤 Contexto de usuario agregado a la policy");
  }

  console.log("📄 Policy generada:", JSON.stringify(policy, null, 2));
  
  return policy;
}

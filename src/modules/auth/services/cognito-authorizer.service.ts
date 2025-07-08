import { CognitoJwtVerifier } from "aws-jwt-verify";

export interface AuthResult {
  username: string;
  email: string;
  userId: string;
  claims: any;
}

export class CognitoAuthorizerService {
  private readonly userPoolId: string;
  private readonly clientId: string;
  private readonly region: string;
  private readonly verifier: any;

  constructor() {
    this.userPoolId = process.env.COGNITO_USER_POOL_ID ?? "";
    this.clientId = process.env.COGNITO_USER_POOL_CLIENT_ID ?? "";
    this.region = process.env.AWS_REGION ?? "us-east-1";

    if (!this.userPoolId || !this.clientId) {
      throw new Error("Variables de entorno de Cognito no configuradas");
    }

    // Inicializar el verificador de JWT de Cognito
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.userPoolId,
      tokenUse: "access",
      clientId: this.clientId,
    });
  }

  /**
   * Valida un token de Cognito
   */
  async validateToken(authorizationHeader: string): Promise<AuthResult> {
    try {
      console.log("🔍 Validando token...");

      // Extraer el token del header "Bearer TOKEN"
      const token = this.extractToken(authorizationHeader);

      if (!token) {
        throw new Error("Token no encontrado en el header");
      }

      console.log("🎟️ Token extraído:", token.substring(0, 50) + "...");

      // Verificar el token con aws-jwt-verify
      const payload = await this.verifier.verify(token);

      console.log("✅ Token verificado exitosamente");
      console.log("👤 Usuario:", payload.username);
      console.log("📧 Email:", payload.email);

      return {
        username: payload.username ?? payload.email ?? "unknown",
        email: payload.email ?? "unknown",
        userId: payload.sub ?? "unknown",
        claims: payload,
      };
    } catch (error) {
      console.error("❌ Error validando token:", error);
      throw new Error(`Token inválido: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  }

  /**
   * Extrae el token del header Authorization
   */
  private extractToken(authorizationHeader: string): string | null {
    if (!authorizationHeader) {
      return null;
    }

    // Verificar formato "Bearer TOKEN"
    const parts = authorizationHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      console.log("❌ Formato de header inválido:", authorizationHeader);
      return null;
    }

    return parts[1];
  }

  /**
   * Método alternativo usando JWT decode manual (sin verificación)
   * Úsalo solo para debugging, NO para producción
   */
  async validateTokenUnsafe(authorizationHeader: string): Promise<AuthResult> {
    const token = this.extractToken(authorizationHeader);

    if (!token) {
      throw new Error("Token no encontrado");
    }

    try {
      // Decodificar JWT sin verificar (solo para debug)
      const base64Payload = token.split(".")[1];
      const payload = JSON.parse(Buffer.from(base64Payload, "base64").toString());

      console.log("🔓 Token decodificado (sin verificar):", payload);

      // Verificar expiración básica
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error("Token expirado");
      }

      return {
        username: payload.username ?? payload.email ?? "unknown",
        email: payload.email ?? "unknown",
        userId: payload.sub ?? "unknown",
        claims: payload,
      };
    } catch (error) {
      console.error("❌ Error decodificando token:", error);
      throw error;
    }
  }
}

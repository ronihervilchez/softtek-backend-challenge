# 🔐 Configuración de Cognito y API Gateway

## 🚀 Configuración Implementada

### ✅ Componentes Agregados:

1. **🏗️ API Gateway**: Configurado automáticamente por Serverless
2. **🔐 Cognito User Pool**: Para manejo de usuarios y autenticación
3. **🔑 Cognito Authorizer**: Integrado con API Gateway
4. **👥 Gestión de Usuarios**: Servicios para crear y gestionar usuarios
5. **🛡️ Middleware de Autenticación**: Para validar tokens automáticamente

## 📋 Recursos Creados

### 🔐 Cognito User Pool
- **Nombre**: `softtek-backend-challenge-user-pool-{stage}`
- **Atributos**: email, name
- **Política de contraseñas**: Mínimo 8 caracteres, mayúsculas, minúsculas, números
- **Verificación**: Email automática

### 🔑 Cognito User Pool Client
- **Nombre**: `softtek-backend-challenge-client-{stage}`
- **Flujos de autenticación**: USER_PASSWORD_AUTH, USER_SRP_AUTH
- **Validez de tokens**:
  - Access Token: 60 minutos
  - ID Token: 60 minutos
  - Refresh Token: 30 días

### 🌐 API Gateway
- **Nombre**: `softtek-backend-challenge-api-{stage}`
- **Tipo**: Regional
- **CORS**: Habilitado
- **Autorizador**: Cognito User Pools

## 🛠️ Deployment

### 1. Instalar dependencias adicionales
```bash
npm install @aws-sdk/client-cognito-identity-provider
```

### 2. Hacer deploy
```bash
# Deploy a desarrollo
npm run deploy:dev

# Deploy a producción
npm run deploy:prod
```

### 3. Obtener información del deployment
Después del deploy, obtendrás:
- **API Gateway URL**: Para hacer requests
- **Cognito User Pool ID**: Para configurar aplicaciones cliente

**Nota**: Las variables que realmente necesitas configurar son:
- `COGNITO_USER_POOL_ID`: ID del User Pool creado
- `AWS_REGION`: Región donde se despliega (ej: us-east-1)

### 4. Configurar variables de entorno
Actualiza tus archivos de configuración:

**Archivo `.env.dev`:**
```
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXX
AWS_REGION=us-east-1
STAGE=dev
NODE_ENV=development
```

**Archivo `.env.prod`:**
```
COGNITO_USER_POOL_ID=us-east-1_YYYYYYYY
AWS_REGION=us-east-1
STAGE=prod
NODE_ENV=production
```

## 🔧 Configuración Post-Deploy

### 1. Crear grupos de usuarios en Cognito
```bash
aws cognito-idp create-group --group-name admin --user-pool-id YOUR_USER_POOL_ID --description "Administrators"
aws cognito-idp create-group --group-name users --user-pool-id YOUR_USER_POOL_ID --description "Regular users"
aws cognito-idp create-group --group-name writers --user-pool-id YOUR_USER_POOL_ID --description "Users with write permissions"
```

### 2. Crear usuarios de prueba
```bash
# Ejecutar el script de creación de usuarios
node -e "
const { createTestUsers } = require('./dist/modules/external-services/cognito-user-manager.service.js');
createTestUsers();
"
```

## 🔑 Autenticación

### 1. Obtener token de acceso
```bash
# Usando AWS CLI
aws cognito-idp admin-initiate-auth \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=admin@softtek.com,PASSWORD=TempPass123!
```

### 2. Usar token en requests
```bash
# Ejemplo de request con token
curl -X GET \
  "https://your-api-gateway-url.amazonaws.com/dev/fusionados" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📊 Endpoints Disponibles

### 🟢 Endpoints Protegidos (Requieren autenticación):
- `GET /fusionados` - Obtener datos fusionados
- `POST /almacenar` - Almacenar datos
- `GET /historial` - Obtener historial

### 🔓 Endpoints Públicos:
- `GET /health` - Health check del servicio

## 🛡️ Permisos por Grupos

### 👑 admin
- **Acceso**: Total (read, write, admin)
- **Endpoints**: Todos los endpoints disponibles

### 👥 users
- **Acceso**: Solo lectura (read)
- **Endpoints**: GET /fusionados, GET /historial

### ✍️ writers
- **Acceso**: Lectura y escritura (read, write)
- **Endpoints**: Todos los endpoints excepto admin

## 🔧 Configuración Local

Para desarrollo local, puedes usar:

```bash
# Ejecutar offline (sin autenticación)
npm run start

# Los endpoints estarán disponibles en:
# http://localhost:3000/dev/fusionados
# http://localhost:3000/dev/almacenar
# http://localhost:3000/dev/historial
# http://localhost:3000/dev/health
```

## 📝 Notas Importantes

1. **🔐 Seguridad**: En producción, usa contraseñas más seguras
2. **🌐 CORS**: Configurado para permitir todos los orígenes (ajustar en producción)
3. **⏰ Tokens**: Los tokens expiran en 60 minutos
4. **🔄 Refresh**: Implementar refresh token logic en el cliente
5. **🛡️ Middleware**: Usa `withAuth` para proteger endpoints automáticamente

## 🧪 Testing

### 1. Test de autenticación
```typescript
// Ejemplo de test con token
const response = await fetch('https://your-api.amazonaws.com/dev/fusionados', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

### 2. Test sin autenticación (debe fallar)
```typescript
const response = await fetch('https://your-api.amazonaws.com/dev/fusionados');
// Debería retornar 401 Unauthorized
```

## 📚 Recursos Útiles

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [API Gateway Authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-authorizers.html)
- [Serverless Framework AWS Documentation](https://www.serverless.com/framework/docs/providers/aws/)

---

🎉 **¡Autenticación con Cognito configurada exitosamente!**

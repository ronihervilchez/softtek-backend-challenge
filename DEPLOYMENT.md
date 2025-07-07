# 🚀 Guía de Deployment - Softtek Backend Challenge

Esta guía detalla el proceso completo para hacer deployment del proyecto usando AWS CDK con configuración cross-account.

## 📋 Prerrequisitos

### 🛠️ Herramientas Requeridas
- **Node.js** 20.x o superior
- **npm** 9.x o superior
- **AWS CLI** configurado
- **AWS CDK** instalado globalmente

```bash
# Verificar herramientas
node --version
npm --version
aws --version

# Instalar CDK si no está instalado
npm install -g aws-cdk
cdk --version
```

## 🏗️ Arquitectura de Deployment

### 📊 Configuración Cross-Account
- **Cuenta Principal (Root)**: `ID_ROOT` - Donde se despliegan los recursos
- **Cuenta Limitada**: `ID_LIMITADO` - Cuenta con permisos restringidos para deployment
- **Usuario**: `cdk-deployer` - Usuario en cuenta limitada con permisos de AssumeRole

## 🔐 Configuración de Permisos AWS

### 1. Rol en Cuenta Principal (ROOT)

#### 📝 Trust Policy del rol `cdk-deploy-role`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::ID_ROOT:root",
          "arn:aws:iam::ID_LIMITADO:user/cdk-deployer"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

#### 🛡️ Políticas Requeridas para el rol `cdk-deploy-role`:

**Políticas AWS Managed necesarias:**
```
✅ AmazonAPIGatewayAdministrator
✅ AmazonCognitoPowerUser
✅ AmazonDynamoDBFullAccess
✅ AmazonS3FullAccess
✅ AWSCloudFormationFullAccess
✅ AWSLambda_FullAccess
✅ IAMFullAccess
✅ AmazonEC2ContainerRegistryFullAccess
✅ AmazonSSMFullAccess
✅ CloudWatchLogsFullAccess
✅ AmazonEventBridgeFullAccess
```

**Alternativa (más simple pero menos granular):**
```
AdministratorAccess
```

### 2. Usuario en Cuenta Limitada

#### 🎯 Política para usuario `cdk-deployer`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::ID_ROOT:role/cdk-deploy-role"
    }
  ]
}
```

### 3. Política de Protección Presupuestaria (Opcional)

#### 🚨 Política que se activa al alcanzar límite presupuestario:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyCostlyServices",
      "Effect": "Deny",
      "Action": [
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "elasticache:*",
        "ecr:*",
        "ssm:*",
        "logs:*",
        "events:*",
        "s3:*",
        "cloudformation:*",
        "cognito-idp:*",
        "iam:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## ⚙️ Configuración Local

### 1. AWS CLI Profile

#### 📝 Configurar perfil cross-account en `~/.aws/config`:
```ini
[profile limitada]
region = us-east-1
output = json

[profile cdk-crossaccount]
role_arn = arn:aws:iam::ID_ROOT:role/cdk-deploy-role
source_profile = limitada
region = us-east-1
duration_seconds = 3600
```

#### 🔑 Credenciales en `~/.aws/credentials`:
```ini
[limitada]
aws_access_key_id = ACCESS_KEY_DE_CUENTA_LIMITADA
aws_secret_access_key = SECRET_KEY_DE_CUENTA_LIMITADA
```

### 2. Variables de Entorno (.env)

```env
# ========================================
# 🏗️ CONFIGURACIÓN DE AWS CDK
# ========================================
CDK_DEFAULT_ACCOUNT=ID_ROOT
CDK_DEFAULT_REGION=us-east-1

# ========================================
# 🌐 CONFIGURACIÓN DE AWS
# ========================================
AWS_REGION=us-east-1

# ========================================
# 🗄️ CONFIGURACIÓN DE DYNAMODB
# ========================================
DYNAMODB_TABLE_CACHE=softtek-cache
DYNAMODB_TABLE_DATA=softtek-data
DYNAMODB_TABLE_USUARIOS=softtek-usuarios

# ========================================
# 🔐 CONFIGURACIÓN DE COGNITO
# ========================================
COGNITO_USER_POOL_ID=          # Se completa después del deploy
COGNITO_USER_POOL_CLIENT_ID=   # Se completa después del deploy

# ========================================
# 🚀 CONFIGURACIÓN DE AMBIENTE
# ========================================
NODE_ENV=development
STAGE=dev
```

## 🚀 Proceso de Deployment

### 1. Verificación Inicial

```bash
# Verificar configuración AWS
aws sts get-caller-identity --profile limitada
aws sts get-caller-identity --profile cdk-crossaccount

# Verificar herramientas
cdk --version
node --version
npm --version
```

### 2. Preparación del Proyecto

```bash
# Navegar al directorio del proyecto
cd "path/proyecto"

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

### 3. Bootstrap CDK (Solo primera vez)

```bash
# Limpiar contexto CDK (si es necesario)
cdk context --clear
rm -rf cdk.out/

# Bootstrap CDK en la cuenta destino
cdk bootstrap --profile cdk-crossaccount --force
```

#### ✅ Salida esperada del bootstrap exitoso:
```
✅ Environment aws://ID_ROOT/us-east-1 bootstrapped.
```

### 4. Deploy de la Aplicación

```bash
# Ver qué recursos se van a crear (opcional)
cdk synth --profile cdk-crossaccount

# Deploy completo
cdk deploy --profile cdk-crossaccount --require-approval never
```

#### ✅ Salida esperada del deploy exitoso:
```
✅ SofttekBackendStack

Stack ARN:
arn:aws:cloudformation:us-east-1:ID_ROOT:stack/SofttekBackendStack/...

Outputs:
SofttekBackendStack.ApiGatewayUrl = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
```

## 📦 Recursos Creados

### 🗄️ DynamoDB Tables
- **softtek-cache**: Cache temporal con TTL de 30 minutos
- **softtek-data**: Historial persistente con GSI para consultas ordenadas
- **softtek-usuarios**: Datos de usuarios

### ⚡ Lambda Functions
- **fusionadosFunction**: GET /fusionados - Fusión de datos con cache
- **almacenarFunction**: POST /almacenar - Almacenamiento de usuarios
- **historialFunction**: GET /historial - Consulta de historial paginado
- **healthFunction**: GET /health - Health check

### 🌐 API Gateway
- **REST API** con 4 endpoints
- **CORS** habilitado
- **Integración** con Lambda functions

### 🔐 Cognito (Opcional)
- **User Pool** para autenticación
- **Client** configurado

## 🧪 Verificación Post-Deploy

### 1. Test de Endpoints

```bash
# Reemplazar con la URL obtenida del deploy
API_URL="https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev"

# Health Check
curl $API_URL/health

# Fusionados (datos de Star Wars API)
curl $API_URL/fusionados

# Almacenar usuario
curl -X POST $API_URL/almacenar \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "test123",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "fechaNacimiento": "1990-01-01",
    "telefono": "+1234567890"
  }'

# Historial
curl $API_URL/historial
```

### 2. Verificación en AWS Console

- **CloudFormation**: Verificar stack `SofttekBackendStack`
- **DynamoDB**: Verificar tablas creadas
- **Lambda**: Verificar functions desplegadas
- **API Gateway**: Verificar endpoints configurados

## 🔧 Troubleshooting

### Errores Comunes

#### 1. `AssumeRole access denied`
**Problema**: Usuario no puede asumir el rol
**Solución**: Verificar Trust Policy del rol y permisos del usuario

#### 2. `ECR CreateRepository denied`
**Problema**: Faltan permisos de ECR
**Solución**: Agregar `AmazonEC2ContainerRegistryFullAccess` al rol

#### 3. `SSM PutParameter error`
**Problema**: Faltan permisos de SSM
**Solución**: Agregar `AmazonSSMFullAccess` al rol

#### 4. `Stack already exists`
**Problema**: Stack anterior falló y no se limpió
**Solución**:
```bash
aws cloudformation delete-stack --stack-name CDKToolkit --profile cdk-crossaccount
```

### Comandos de Limpieza

```bash
# Destruir stack completo
cdk destroy --profile cdk-crossaccount

# Limpiar bootstrap
aws cloudformation delete-stack --stack-name CDKToolkit --profile cdk-crossaccount

# Limpiar contexto CDK
cdk context --clear
rm -rf cdk.out/
```

## 🗑️ Eliminación Completa de Recursos

### 1. Eliminar Stack Principal

```bash
# Eliminar la aplicación completa (stack principal)
cdk destroy --profile cdk-crossaccount --force
```

**⚠️ Confirmación requerida**: Este comando te pedirá confirmación antes de eliminar todos los recursos.

### 2. Eliminar Bootstrap CDK (Opcional)

```bash
# Eliminar también la infraestructura de CDK (bootstrap)
aws cloudformation delete-stack \
  --stack-name CDKToolkit \
  --profile cdk-crossaccount \
  --region us-east-1

# Verificar que se eliminó
aws cloudformation wait stack-delete-complete \
  --stack-name CDKToolkit \
  --profile cdk-crossaccount \
  --region us-east-1
```

### 3. Limpiar Contexto Local

```bash
# Limpiar cache y contexto de CDK
cdk context --clear
rm -rf cdk.out/
rm -rf node_modules/.cache/
```

### 4. Verificación de Eliminación

```bash
# Verificar que no quedan stacks
aws cloudformation list-stacks \
  --profile cdk-crossaccount \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Verificar DynamoDB tables eliminadas
aws dynamodb list-tables \
  --profile cdk-crossaccount \
  --region us-east-1

# Verificar Lambda functions eliminadas
aws lambda list-functions \
  --profile cdk-crossaccount \
  --region us-east-1
```

### 5. Comando de Eliminación Completa (Todo en uno)

```bash
# Script completo para eliminar todo
echo "🗑️ Eliminando stack principal..."
cdk destroy --profile cdk-crossaccount --force

echo "🧹 Eliminando bootstrap CDK..."
aws cloudformation delete-stack --stack-name CDKToolkit --profile cdk-crossaccount --region us-east-1

echo "🧽 Limpiando contexto local..."
cdk context --clear
rm -rf cdk.out/

echo "✅ Eliminación completa finalizada"
```

### ⚠️ Recursos que Pueden Persistir

Algunos recursos pueden requerir eliminación manual:

#### 🗃️ **S3 Buckets con Contenido**
```bash
# Si hay buckets S3 con objetos, eliminar contenido primero
aws s3 rm s3://BUCKET_NAME --recursive --profile cdk-crossaccount
aws s3 rb s3://BUCKET_NAME --profile cdk-crossaccount
```

#### 📋 **CloudWatch Log Groups**
```bash
# Eliminar log groups si persisten
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/softtek" \
  --profile cdk-crossaccount

aws logs delete-log-group \
  --log-group-name "/aws/lambda/softtek-function-name" \
  --profile cdk-crossaccount
```

#### 🔐 **Cognito User Pools**
```bash
# Si Cognito no se elimina automáticamente
aws cognito-idp list-user-pools --max-results 10 --profile cdk-crossaccount
aws cognito-idp delete-user-pool --user-pool-id YOUR_POOL_ID --profile cdk-crossaccount
```

## 💰 Control de Costos

### Pre-eliminación: Verificar Costos

```bash
# Ver estimación de costos antes de eliminar
aws ce get-cost-and-usage \
  --time-period Start=2025-07-01,End=2025-07-07 \
  --granularity DAILY \
  --metrics BlendedCost \
  --profile cdk-crossaccount
```

### Post-eliminación: Confirmar $0

```bash
# Verificar que no hay recursos activos generando costos
aws ce get-cost-and-usage \
  --time-period Start=2025-07-07,End=2025-07-08 \
  --granularity DAILY \
  --metrics BlendedCost \
  --profile cdk-crossaccount
```

## 📊 Costos Estimados

### Free Tier Eligible:
- **Lambda**: 1M requests/month
- **API Gateway**: 1M calls/month
- **DynamoDB**: 25GB storage, 25 RCU/WCU
- **CloudWatch Logs**: 5GB ingestion

### Costos Adicionales:
- **ECR**: $0.10/GB/month
- **S3**: $0.023/GB/month (assets CDK)
- **Lambda**: $0.20/1M requests después del free tier

## 🔒 Mejores Prácticas de Seguridad

1. **Usar roles específicos** en lugar de `AdministratorAccess`
2. **Configurar alertas presupuestarias** antes del deployment
3. **Rotar credenciales** regularmente
4. **Monitorear CloudTrail** para actividad inusual
5. **Usar políticas restrictivas** en cuentas de producción

## 📝 Notas Importantes

- ⚠️ **Nunca** commitear credenciales en git
- 🔄 **Actualizar** `COGNITO_USER_POOL_ID` después del primer deploy
- 📊 **Monitorear** costos regularmente
- 🧹 **Limpiar** recursos no utilizados
- 🔐 **Revisar** permisos periódicamente

---

Para más información sobre configuración específica, consulta:
- [README.md](./README.md) - Información general del proyecto
- [.env](./.env.example) - Variables de entorno
- [lib/softtek-backend-stack.ts](./lib/softtek-backend-stack.ts) - Definición de infraestructura

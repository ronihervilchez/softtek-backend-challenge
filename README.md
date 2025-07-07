# 🎯 Softtek Backend Challenge

Este proyecto es un backend serverless desarrollado con AWS CDK, TypeScript y Lambda que proporciona una API REST para gestión de usuarios, datos fusionados e historial. Utiliza DynamoDB como base de datos y sigue una arquitectura modular escalable.

## 🚀 Arquitectura del Proyecto

### 📊 Tablas DynamoDB

El proyecto utiliza **tres tablas DynamoDB separadas** para optimizar el rendimiento y la organización:

#### 1. **softtek-cache** (Cache Temporal)
- **Propósito**: Cache de datos fusionados con TTL de 30 minutos
- **Partition Key**: `id` (string)
- **TTL**: Configurado para eliminar automáticamente registros expirados
- **Uso**: Almacena temporalmente resultados de fusionados para evitar llamadas repetidas a APIs externas

#### 2. **softtek-data** (Historial Persistente)
- **Propósito**: Historial permanente de datos fusionados
- **Partition Key**: `id` (string)
- **GSI**: `categoria-fecha-index` para consultas ordenadas por fecha
- **Sort Key GSI**: `fechaCreacion` (descendente)
- **Uso**: Almacena historial de todas las operaciones de fusionados

#### 3. **softtek-usuarios** (Datos de Usuarios)
- **Propósito**: Información de usuarios almacenada
- **Partition Key**: `usuario` (string)
- **Uso**: Almacena datos personales de usuarios (nombres, apellidos, teléfono, etc.)

### 📁 Estructura Modular del Proyecto

```
src/
├── handlers/                    # ⚡ Handlers Lambda - Punto de entrada
│   ├── health.ts               # Health check endpoint
│   └── swagger.ts              # Swagger documentation endpoint
├── interfaces/                 # 🔧 Interfaces globales TypeScript
│   ├── dynamodb.interface.ts
│   ├── fusionado.interface.ts
│   ├── response.interface.ts    # ResponseBody<T> estándar
│   ├── service.interface.ts
│   └── index.ts
├── modules/                    # 🧩 Módulos organizados por funcionalidad
│   ├── almacenar/             # 📦 Módulo de almacenamiento de usuarios
│   │   ├── controllers/
│   │   │   ├── almacenar.controller.ts
│   │   │   └── index.ts
│   │   ├── dtos/
│   │   │   ├── almacenar.dto.ts      # Validación con class-validator
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── almacenar.repository.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── almacenar.service.ts  # Servicio consolidado para usuarios
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── fusionados/            # 🔗 Módulo de datos fusionados
│   │   ├── controllers/
│   │   │   ├── fusionados.controller.ts
│   │   │   └── index.ts
│   │   ├── dtos/
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── fusionados.repository.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── fusionados.service.ts # Cache + Historial + APIs externas
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── historial/             # 📋 Módulo de historial
│   │   ├── controllers/
│   │   │   ├── historial.controller.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── historial.service.ts  # DynamoDB historial con paginación
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── database/              # 🗄️ Servicios generales de base de datos
│   │   ├── interfaces/
│   │   │   └── database.interface.ts
│   │   ├── schemas/
│   │   │   └── index.ts             # CacheSchema, HistorialSchema, UsuariosSchema
│   │   ├── services/
│   │   │   ├── cache.service.ts     # Servicio de cache (fusionados)
│   │   │   ├── database.service.ts  # Servicio base DynamoDB
│   │   │   └── index.ts
│   │   └── index.ts
│   └── external-services/     # 🌐 Servicios externos
│       ├── auth.service.ts
│       ├── cache.service.ts
│       ├── cognito-auth.service.ts
│       ├── cognito-user-manager.service.ts
│       ├── database.service.ts
│       ├── external-api.service.ts  # APIs de Star Wars, Personas, etc.
│       ├── interfaces/
│       │   ├── people.interface.ts
│       │   └── response.interface.ts
│       └── index.ts
└── utils/                     # 🛠️ Utilidades compartidas
    ├── response.util.ts       # ResponseBody<T> helpers
    └── validation.util.ts     # Validación con class-validator
```

### 🔧 Patrón de Respuestas Estándar

Todos los endpoints siguen el patrón `ResponseBody<T>` para consistencia:

```typescript
// Respuesta exitosa
ResponseBody<T> {
  success: true,
  data: T,              // Tipo específico del endpoint
  message: string,
  timestamp: string
}

// Respuesta de error
ResponseBody<never> {
  success: false,
  message: string,
  errors?: string[],
  timestamp: string
  // data ausente en errores
}
```

## 🎯 Endpoints Disponibles

### 🟢 GET /fusionados
- **Descripción**: Obtiene datos fusionados de APIs externas con cache inteligente
- **Método**: GET
- **Query Parameters**: Filtros opcionales
- **URL Local**: `http://localhost:3000/fusionados`
- **Respuesta**: `ResponseBody<IPerson[]>`
- **Cache**: Los resultados se cachean por 30 minutos para optimizar rendimiento

### 🟡 POST /almacenar
- **Descripción**: Almacena datos de usuario con validación robusta
- **Método**: POST
- **Body**: AlmacenarDto (validado con class-validator)
- **URL Local**: `http://localhost:3000/almacenar`
- **Respuesta**: `ResponseBody<UsuariosSchema>`
- **Validación**: Campos requeridos: nombre, apellido, telefono

### 🔵 GET /historial
- **Descripción**: Obtiene historial de operaciones ordenado por fecha (más reciente primero)
- **Método**: GET
- **Query Parameters**:
  - `categoria` (opcional): Filtrar por categoría
  - `limit` (opcional): Número de elementos por página (default: 20)
  - `lastEvaluatedKey` (opcional): Token de paginación
- **URL Local**: `http://localhost:3000/historial`
- **Respuesta**: `ResponseBody<IHistoryList>`
- **Características**: Paginación automática y consultas optimizadas con GSI

### 💚 GET /health
- **Descripción**: Health check del servicio y verificación de conectividad
- **Método**: GET
- **URL Local**: `http://localhost:3000/health`
- **Respuesta**: `ResponseBody<HealthData>`
- **Estado**: Siempre disponible, no requiere autenticación

## � Documentación de la API

### � Swagger UI
La documentación completa de la API está disponible a través de Swagger UI:

- **Local**: http://localhost:3000/docs
- **Producción**: https://your-api-id.execute-api.us-east-1.amazonaws.com/docs

### 🔐 Autenticación
Los endpoints protegidos requieren autenticación mediante AWS Cognito:

```bash
# Ejemplo de header de autorización
Authorization: Bearer <JWT_TOKEN>
```
## 🚀 Inicio Rápido

### 📋 Prerrequisitos
- Node.js 20.x o superior
- npm 9.x o superior
- AWS CLI configurado (para deployment)

### � Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd softtek-backend-challenge

# Instalar dependencias
npm install

# Verificar tipos TypeScript
npm run typecheck

# Construir el proyecto
npm run build

# Bootstrap CDK (solo primera vez)
npm run bootstrap
```

### � Ejecutar en modo desarrollo

```bash

# Iniciar servidor local
npm run start

# El servidor estará disponible en:
# - API: http://localhost:3000
# - Documentación: http://localhost:3000/docs
# - Health Check: http://localhost:3000/health
```

### 📖 Probar la documentación

1. **Iniciar el servidor local**:
   ```bash
   npm run start
   ```

2. **Abrir la documentación**:
   - Navegar a: http://localhost:3000/docs
   - La interfaz de Swagger UI se cargará automáticamente

3. **Probar endpoints**:
   - **Health Check**: http://localhost:3000/health (sin autenticación)
   - **Endpoints protegidos**: Requieren token JWT de AWS Cognito

## 🏗️ Arquitectura del Sistema

### ✅ Ventajas de la arquitectura modular:

1. **🎯 Separación de responsabilidades**: Cada módulo maneja una funcionalidad específica
2. **� Escalabilidad**: Fácil agregar nuevos módulos sin afectar los existentes
3. **🔧 Mantenibilidad**: Código organizado y fácil de mantener
4. **🧪 Testabilidad**: Cada módulo puede ser probado independientemente
5. **♻️ Reutilización**: Servicios externos pueden ser reutilizados por múltiples módulos

### 🏛️ Capas de la Aplicación

1. **⚡ Handlers**: Punto de entrada para las funciones Lambda
2. **🎮 Controllers**: Manejo de requests/responses HTTP
3. **🏢 Services**: Lógica de negocio específica de cada módulo
4. **💾 Repositories**: Acceso a datos y base de datos
5. **📋 DTOs**: Validación de datos de entrada con class-validator
6. **🌐 External Services**: Encapsula llamadas a APIs externas
7. **🛠️ Utils**: Utilidades compartidas entre módulos

## 🔧 Configuración del Proyecto

### 1. Configurar variables de entorno
Edita el archivo `.env` con tus configuraciones reales:

```env
# AWS Configuration
CDK_DEFAULT_ACCOUNT=828220034556        # Tu AWS Account ID
AWS_REGION=us-east-1

# DynamoDB Tables
DYNAMODB_TABLE_CACHE=softtek-cache      # Cache temporal (TTL 30 min)
DYNAMODB_TABLE_DATA=softtek-data        # Historial persistente
DYNAMODB_TABLE_USUARIOS=softtek-usuarios # Datos de usuarios

# Cognito (opcional para desarrollo local)
COGNITO_USER_POOL_ID=                   # Completar después del deploy
COGNITO_USER_POOL_CLIENT_ID=            # Completar después del deploy

# Environment
NODE_ENV=development
STAGE=dev
```

**Variables esenciales del proyecto:**
- `CDK_DEFAULT_ACCOUNT`: Tu AWS Account ID para deployment
- `AWS_REGION`: Región de AWS donde se despliega
- `DYNAMODB_TABLE_CACHE`: Tabla para cache temporal con TTL
- `DYNAMODB_TABLE_DATA`: Tabla para historial persistente
- `DYNAMODB_TABLE_USUARIOS`: Tabla para datos de usuarios
- `COGNITO_USER_POOL_ID`: ID del User Pool (solo para testing local)
- `STAGE`: Ambiente de despliegue (dev/prod)
- `NODE_ENV`: Modo de Node.js (development/production)

**Nota importante**: Las APIs externas utilizadas (Star Wars API) son públicas y no requieren API keys.

### 2. Ejecutar en desarrollo
```bash
npm run start
```

El servidor estará disponible en: `http://localhost:3000`

## 🚀 Tecnologías Utilizadas

- **☁️ AWS CDK**: Infrastructure as Code para gestión de infraestructura
- **📘 TypeScript**: Tipado estático y mejor desarrollo
- **✅ class-validator**: Validación robusta de DTOs
- **🔄 class-transformer**: Transformación de datos
- **🌩️ AWS Lambda**: Funciones serverless escalables
- **📦 ESBuild**: Bundling rápido y minificación
- **🔐 AWS Cognito**: Autenticación y autorización de usuarios
- **🌐 API Gateway**: Gestión de APIs REST
- **🗃️ DynamoDB**: Base de datos NoSQL para almacenamiento y cache

## 🚀 Deployment

### Desarrollo Local
```bash
npm run start
```

### Deployment Manual
```bash
# Deploy a desarrollo
npm run deploy:dev

# Deploy a producción
npm run deploy:prod
```

### Deployment Automático (GitHub Actions)
```bash
# Deploy a desarrollo
git push origin develop

# Deploy a producción
git push origin main
```

### Eliminación de Recursos
```bash
# Eliminar stack completo
cdk destroy --profile cdk-crossaccount --force

# Eliminar también CDK bootstrap (opcional)
aws cloudformation delete-stack --stack-name CDKToolkit --profile cdk-crossaccount
```

**📖 Para más detalles de deployment y eliminación, consulta [DEPLOYMENT.md](./DEPLOYMENT.md)**

## 📊 Estado del Proyecto

✅ **Completado:**
- **Arquitectura modular con tres DynamoDB tables separadas** (cache, historial, usuarios)
- **Servicios consolidados y organizados por funcionalidad**
- **Cuatro endpoints funcionales con validación robusta**
- **Cache inteligente con TTL de 30 minutos para optimizar rendimiento**
- **Historial con paginación y consultas optimizadas usando GSI**
- **Validación completa con class-validator**
- **Documentación Swagger automática**
- **Respuestas estandarizadas con ResponseBody<T>**
- **Desarrollo local funcionando correctamente**
- **Configuración de deployment automático con GitHub Actions**
- **Autenticación y autorización con AWS Cognito**
- **Type safety completo con TypeScript**

🔧 **Características técnicas:**
- **O(1) lookups** en operaciones de fusionados usando Maps
- **Schemas tipados** para cada tabla DynamoDB
- **Error handling** robusto y consistente
- **Modular architecture** escalable y mantenible
- **Clean code** siguiendo principios SOLID

---

🎉 **¡Proyecto con arquitectura serverless escalable y moderna!**

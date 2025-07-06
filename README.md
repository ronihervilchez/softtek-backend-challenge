# 🎯 Softtek Backend Challenge

## � Documentación de la API

### 🔗 Swagger UI
La documentación completa de la API está disponible a través de Swagger UI:

- **Local**: http://localhost:3000/docs
- **Producción**: https://your-api-id.execute-api.us-east-1.amazonaws.com/docs

### 📋 Endpoints Principales

| Endpoint | Método | Descripción | Autenticación |
|----------|--------|-------------|---------------|
| `/health` | GET | Health check del servicio | ❌ No requerida |
| `/docs` | GET | Documentación Swagger UI | ❌ No requerida |
| `/fusionados` | GET | Obtener datos fusionados | ✅ Cognito JWT |
| `/almacenar` | POST | Almacenar datos | ✅ Cognito JWT |
| `/historial` | GET | Obtener historial | ✅ Cognito JWT |
| `/external/people` | GET | Obtener personas (con caché) | ❌ No requerida |
| `/external/planets` | GET | Obtener planetas (con caché) | ❌ No requerida |
| `/external/films` | GET | Obtener películas (con caché) | ❌ No requerida |

## �🚀 Estructura del Proyecto Reorganizada

El proyecto ha sido reorganizado siguiendo una **arquitectura modular** que separa cada funcionalidad en módulos independientes.

### 📁 Nueva Estructura por Módulos

```
src/
├── modules/                    # 🧩 Módulos organizados por funcionalidad
│   ├── almacenar/             # 📦 Módulo de almacenamiento
│   │   ├── controllers/
│   │   │   ├── almacenar.controller.ts
│   │   │   └── index.ts
│   │   ├── dtos/
│   │   │   ├── almacenar.dto.ts
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── almacenar.repository.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── almacenar.service.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── fusionados/            # 🔗 Módulo de datos fusionados
│   │   ├── controllers/
│   │   │   ├── fusionados.controller.ts
│   │   │   └── index.ts
│   │   ├── dtos/
│   │   │   └── index.ts       # Preparado para futuros DTOs
│   │   ├── repositories/
│   │   │   ├── fusionados.repository.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── fusionados.service.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── historial/             # 📋 Módulo de historial
│   │   ├── controllers/
│   │   │   ├── historial.controller.ts
│   │   │   └── index.ts
│   │   ├── dtos/
│   │   │   └── index.ts       # Preparado para futuros DTOs
│   │   ├── repositories/
│   │   │   ├── historial.repository.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── historial.service.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── external-services/     # 🌐 Módulo de servicios externos
│       ├── external-api.service.ts
│       ├── database.service.ts
│       ├── auth.service.ts
│       ├── cognito-auth.service.ts
│       ├── cognito-user-manager.service.ts
│       └── index.ts
├── handlers/                  # ⚡ Handlers Lambda - Punto de entrada
│   ├── fusionados.ts
│   ├── almacenar.ts
│   ├── historial.ts
│   └── health.ts
└── utils/                     # 🛠️ Utilidades compartidas
    ├── response.util.ts
    └── validation.util.ts
```

## 🚀 Inicio Rápido

### 📋 Prerrequisitos
- Node.js 20.x o superior
- npm 9.x o superior  
- AWS CLI configurado (para deployment)

### 🔧 Instalación

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

### 🔐 Autenticación

Los endpoints protegidos requieren autenticación mediante AWS Cognito:

```bash
# Ejemplo de header de autorización
Authorization: Bearer <JWT_TOKEN>
```

## �🎯 Endpoints Disponibles

### 🟢 GET /fusionados
- **Descripción**: Obtiene datos fusionados con procesamiento
- **Método**: GET
- **Query Parameters**: Filtros opcionales
- **URL Local**: `http://localhost:3000/fusionados`

### 🟡 POST /almacenar
- **Descripción**: Almacena nuevos datos con validación
- **Método**: POST
- **Body**: AlmacenarDto (validado con class-validator)
- **URL Local**: `http://localhost:3000/almacenar`

### 🔵 GET /historial
- **Descripción**: Obtiene historial ordenado por fecha
- **Método**: GET
- **Query Parameters**: Filtros opcionales
- **URL Local**: `http://localhost:3000/historial`

## 🏗️ Arquitectura Modular

### ✅ Ventajas de esta estructura:

1. **🎯 Separación de responsabilidades**: Cada módulo maneja una funcionalidad específica
2. **📈 Escalabilidad**: Fácil agregar nuevos módulos sin afectar los existentes
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

## 📦 Instalación y Ejecución

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Edita el archivo `.env.dev` con tus configuraciones reales:

```env
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXX
AWS_REGION=us-east-1
STAGE=dev
NODE_ENV=development
```

**Variables utilizadas en el proyecto:**
- `COGNITO_USER_POOL_ID`: ID del User Pool de Cognito para autenticación
- `AWS_REGION`: Región de AWS donde se despliega el proyecto
- `STAGE`: Ambiente de despliegue (dev/prod)
- `NODE_ENV`: Modo de Node.js (development/production)

**Nota**: Se han eliminado las variables no utilizadas en el código para simplificar la configuración.

### 3. Ejecutar en desarrollo
```bash
npm run start
```

El servidor estará disponible en: `http://localhost:3000`

## 🔧 Servicios Externos Disponibles

### 🌐 ExternalApiService
Servicio genérico para llamadas HTTP a APIs externas:
- `get(url, headers?)`
- `post(url, data, headers?)`
- `put(url, data, headers?)`
- `delete(url, headers?)`

### � DatabaseService
Servicio para operaciones de base de datos:
- `query(sql, params?)`
- `insert(table, data)`
- `update(table, data, where)`
- `delete(table, where)`

### � AuthService
Servicio para autenticación:
- `validateToken(token)`
- `getUserInfo(userId)`

## 📝 Ejemplo de DTO (AlmacenarDto)

```typescript
{
  "nombre": "string (requerido)",
  "descripcion": "string (requerido)",
  "datos": "object (opcional)",
  "tags": "string[] (opcional)",
  "categoria": "string (requerido)",
  "usuario": "string (opcional)"
}
```

## 🔄 Estructura de Respuesta Estándar

```typescript
{
  "success": boolean,
  "data": any,
  "message": string,
  "errors": string[],
  "timestamp": string
}
```

## 🚀 Tecnologías Utilizadas

- **⚡ Serverless Framework**: Para deployment y manejo de infraestructura
- **📘 TypeScript**: Tipado estático y mejor desarrollo
- **✅ class-validator**: Validación robusta de DTOs
- **🔄 class-transformer**: Transformación de datos
- **🌩️ AWS Lambda**: Funciones serverless escalables
- **📦 ESBuild**: Bundling rápido y minificación
- **🔧 Serverless Offline**: Desarrollo local
- **🔐 AWS Cognito**: Autenticación y autorización de usuarios
- **🌐 API Gateway**: Gestión de APIs REST

## 🔧 Variables de Entorno

### Variables Utilizadas en el Proyecto

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `COGNITO_USER_POOL_ID` | ID del User Pool de Cognito | `us-east-1_XXXXXXXX` |
| `AWS_REGION` | Región de AWS | `us-east-1` |
| `STAGE` | Ambiente de despliegue | `dev` / `prod` |
| `NODE_ENV` | Modo de Node.js | `development` / `production` |

### Configuración por Ambiente

**Desarrollo (`.env.dev`):**
```env
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXX
AWS_REGION=us-east-1
STAGE=dev
NODE_ENV=development
```

**Producción (`.env.prod`):**
```env
COGNITO_USER_POOL_ID=us-east-1_YYYYYYYY
AWS_REGION=us-east-1
STAGE=prod
NODE_ENV=production
```

### Configuración en GitHub Actions

Para el CI/CD, configura los siguientes secrets en tu repositorio:

**AWS Credentials:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

**Desarrollo:**
- `DEV_COGNITO_USER_POOL_ID`

**Producción:**
- `PROD_COGNITO_USER_POOL_ID`

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

## 📊 Estado del Proyecto

✅ **Completado:**
- **Arquitectura modular implementada con estructura de carpetas organizada**
- **Tres endpoints funcionales**
- **Validación con class-validator**
- **Servicios externos configurados**
- **Documentación actualizada**
- **Desarrollo local funcionando**
- **Variables de entorno optimizadas y limpiadas (solo las realmente utilizadas)**
- **Configuración de GitHub Actions actualizada**
- **Autenticación con Cognito configurada**
- **Estructura de carpetas organizada por tipo (controllers, services, repositories, dtos)**
- **Archivos index.ts para importaciones simplificadas**

🔧 **Próximos pasos:**
- Conectar base de datos real
- Agregar tests unitarios
- Configurar monitoreo y logging

---

🎉 **¡Proyecto con arquitectura modular optimizada y estructura de carpetas organizada!**
---

Para más información sobre la configuración y deployment, consulta:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del proyecto
- [COGNITO_SETUP.md](./COGNITO_SETUP.md) - Configuración de Cognito
- [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) - Configuración de CI/CD
- [ENV_CLEANUP_REPORT.md](./ENV_CLEANUP_REPORT.md) - Reporte de limpieza de variables
- [MODULE_STRUCTURE_REPORT.md](./MODULE_STRUCTURE_REPORT.md) - Reporte de estructura de módulos

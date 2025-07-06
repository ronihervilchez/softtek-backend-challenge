# Softtek Backend Challenge

## Estructura del Proyecto por Módulos

```
src/
├── modules/                 # Módulos organizados | Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `COGNITO_USER_POOL_ID` | ID del User Pool de Cognito | `us-east-1_XXXXXXXX` |
| `AWS_REGION` | Región de AWS | `us-east-1` |
| `STAGE` | Entorno de despliegue | `dev` o `prod` |
| `NODE_ENV` | Entorno de Node.js | `development` o `production` |cionalidad
│   ├── almacenar/           # Módulo de almacenamiento
│   │   ├── almacenar.controller.ts
│   │   ├── almacenar.service.ts
│   │   ├── almacenar.repository.ts
│   │   ├── almacenar.dto.ts
│   │   └── index.ts
│   ├── fusionados/          # Módulo de datos fusionados
│   │   ├── fusionados.controller.ts
│   │   ├── fusionados.service.ts
│   │   ├── fusionados.repository.ts
│   │   └── index.ts
│   ├── historial/           # Módulo de historial
│   │   ├── historial.controller.ts
│   │   ├── historial.service.ts
│   │   ├── historial.repository.ts
│   │   └── index.ts
│   └── external-services/   # Módulo de servicios externos
│       ├── external-api.service.ts
│       ├── database.service.ts
│       ├── auth.service.ts
│       └── index.ts
├── handlers/                # Handlers Lambda - Punto de entrada
│   ├── fusionados.ts
│   ├── almacenar.ts
│   └── historial.ts
└── utils/                   # Utilidades compartidas
    ├── response.util.ts
    └── validation.util.ts
```

## Endpoints Disponibles

### GET /fusionados
- **Descripción**: Obtiene datos fusionados
- **Método**: GET
- **Query Parameters**: Filtros opcionales
- **Response**: Lista de datos fusionados

### POST /almacenar
- **Descripción**: Almacena nuevos datos
- **Método**: POST
- **Body**: AlmacenarDto (validado con class-validator)
- **Response**: Datos almacenados con ID generado

### GET /historial
- **Descripción**: Obtiene el historial de operaciones
- **Método**: GET
- **Query Parameters**: Filtros opcionales
- **Response**: Lista de operaciones históricas ordenadas por fecha

## Arquitectura por Módulos

### Ventajas de esta estructura:

1. **Separación de responsabilidades**: Cada módulo maneja una funcionalidad específica
2. **Escalabilidad**: Fácil agregar nuevos módulos sin afectar los existentes
3. **Mantenibilidad**: Código organizado y fácil de mantener
4. **Testabilidad**: Cada módulo puede ser probado independientemente
5. **Reutilización**: Servicios externos pueden ser reutilizados por múltiples módulos

### Capas de la Aplicación

1. **Handlers**: Punto de entrada para las funciones Lambda
2. **Controllers**: Manejo de requests/responses HTTP
3. **Services**: Lógica de negocio específica de cada módulo
4. **Repositories**: Acceso a datos y base de datos
5. **DTOs**: Validación de datos de entrada
6. **External Services**: Encapsula llamadas a APIs externas
7. **Utils**: Utilidades compartidas entre módulos

### Validación

Se utiliza `class-validator` para validar los datos de entrada en el endpoint POST /almacenar.

### Ejemplo de DTO (AlmacenarDto)

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

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run start
```

## Estructura de Respuesta

```typescript
{
  "success": boolean,
  "data": any,
  "message": string,
  "errors": string[],
  "timestamp": string
}
```

## Tecnologías

- **Serverless Framework**: Para deployment
- **TypeScript**: Tipado estático
- **class-validator**: Validación de DTOs
- **class-transformer**: Transformación de datos
- **AWS Lambda**: Funciones serverless
- **ESBuild**: Bundling y minificación
- **AWS Cognito**: Autenticación y autorización
- **API Gateway**: Gestión de APIs REST

## Variables de Entorno

### Variables Utilizadas en el Proyecto

El proyecto utiliza las siguientes variables de entorno:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `COGNITO_USER_POOL_ID` | ID del User Pool de Cognito | `us-east-1_XXXXXXXX` |
| `AWS_REGION` | Región de AWS | `us-east-1` |
| `STAGE` | Ambiente de despliegue | `dev` / `prod` |
| `NODE_ENV` | Modo de Node.js | `development` / `production` |

### Configuración por Ambiente

**Desarrollo Local:**
```bash
# .env.dev
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXX
AWS_REGION=us-east-1
STAGE=dev
NODE_ENV=development
```

**Producción:**
```bash
# .env.prod
COGNITO_USER_POOL_ID=us-east-1_YYYYYYYY
AWS_REGION=us-east-1
STAGE=prod
NODE_ENV=production
```

### Configuración en serverless.yml

```yaml
environment:
  COGNITO_USER_POOL_ID: ${env:COGNITO_USER_POOL_ID, ''}
  AWS_REGION: ${env:AWS_REGION, 'us-east-1'}
  STAGE: ${env:STAGE, 'dev'}
  NODE_ENV: ${env:NODE_ENV, 'development'}
```

**Nota**: Las variables que no están siendo utilizadas en el código han sido eliminadas para simplificar la configuración y mejorar la mantenibilidad del proyecto.

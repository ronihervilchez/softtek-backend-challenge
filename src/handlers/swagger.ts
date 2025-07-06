import * as YAML from 'yamljs';
import * as path from 'path';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Cargar el archivo swagger.yaml
const swaggerDocument = YAML.load(path.join(__dirname, '../../swagger.yaml'));

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Actualizar la URL del servidor basado en el entorno
    const region = process.env.AWS_REGION ?? 'us-east-1';
    const apiId = event.requestContext.apiId;
    
    // Actualizar servidores en el documento de Swagger
    swaggerDocument.servers = [
      {
        url: `https://${apiId}.execute-api.${region}.amazonaws.com`,
        description: 'API Gateway - Production environment'
      },
      {
        url: 'http://localhost:3000',
        description: 'Local development server'
      }
    ];

    const pathParameters = event.pathParameters ?? {};
    const resource = pathParameters.proxy ?? '';

    // Manejar diferentes rutas de Swagger UI
    switch (resource) {
      case '':
      case 'index.html':
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
          body: generateSwaggerHTML()
        };

      case 'swagger.json':
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
          body: JSON.stringify(swaggerDocument, null, 2)
        };

      default:
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            message: 'Resource not found',
            error: `Resource '${resource}' not found in Swagger documentation`
          })
        };
    }
  } catch (error) {
    console.error('Error serving Swagger documentation:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

function generateSwaggerHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Softtek Backend Challenge - API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-16x16.png" sizes="16x16" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin: 0;
            background: #fafafa;
        }
        .swagger-ui .topbar {
            background-color: #2c3e50;
        }
        .swagger-ui .topbar .download-url-wrapper {
            display: none;
        }
        .swagger-ui .info {
            margin: 50px 0;
        }
        .swagger-ui .info .title {
            color: #2c3e50;
        }
        .custom-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
        }
        .custom-header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .custom-header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .environment-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 5px 15px;
            border-radius: 20px;
            margin-top: 10px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="custom-header">
        <h1>🚀 Softtek Backend Challenge</h1>
        <p>API Documentation - Star Wars Data Integration</p>
        <div class="environment-badge">
            Environment: POC
        </div>
    </div>
    
    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            // Obtener la URL actual para construir la URL del swagger.json
            const currentUrl = window.location.href;
            const baseUrl = currentUrl.replace(/\\/docs.*$/, '');
            const swaggerJsonUrl = baseUrl + '/docs/swagger.json';
            
            // Configuración de Swagger UI
            const ui = SwaggerUIBundle({
                url: swaggerJsonUrl,
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                validatorUrl: null,
                tryItOutEnabled: true,
                filter: true,
                requestInterceptor: (request) => {
                    // Agregar headers personalizados si es necesario
                    request.headers['X-API-Client'] = 'Swagger-UI';
                    return request;
                },
                responseInterceptor: (response) => {
                    // Procesar respuestas si es necesario
                    return response;
                },
                onComplete: () => {
                    console.log('Swagger UI loaded successfully');
                },
                onFailure: (error) => {
                    console.error('Failed to load Swagger UI:', error);
                }
            });

            // Personalizar el título de la página
            document.title = 'Softtek Backend Challenge - API Docs';
        };
    </script>
</body>
</html>
  `;
}

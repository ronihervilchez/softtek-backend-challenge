import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class SofttekBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    // Tabla para cache temporal de datos fusionados (TTL 30 min)
    const cacheTable = new dynamodb.Table(this, "CacheTable", {
      tableName: "softtek-cache",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "fechaCreacion",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Para POC
      timeToLiveAttribute: "ttl",
    });

    // Tabla para historial de datos fusionados (persistente)
    const dataTable = new dynamodb.Table(this, "DataTable", {
      tableName: "softtek-data",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "fechaCreacion",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Para POC
      pointInTimeRecovery: true,
    });

    // Tabla para datos de usuarios
    const usuariosTable = new dynamodb.Table(this, "UsuariosTable", {
      tableName: "softtek-usuarios",
      partitionKey: {
        name: "usuario",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Para POC
      pointInTimeRecovery: true,
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, "SofttekUserPool", {
      userPoolName: "softtek-backend-challenge-user-pool",
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Para POC
    });

    // Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, "SofttekUserPoolClient", {
      userPool,
      userPoolClientName: "softtek-backend-challenge-client",
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      readAttributes: new cognito.ClientAttributes().withStandardAttributes({
        email: true,
        givenName: true,
        familyName: true,
      }),
      writeAttributes: new cognito.ClientAttributes().withStandardAttributes({
        email: true,
        givenName: true,
        familyName: true,
      }),
      accessTokenValidity: cdk.Duration.minutes(60),
      idTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
    });

    // Configuración común para todas las Lambdas
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        minify: true,
        sourceMap: false,
        target: "es2022",
        format: OutputFormat.CJS,
        externalModules: [
          // AWS SDK v3 está disponible en el runtime de Lambda
          "@aws-sdk/*",
        ],
        forceDockerBundling: false, // Usar bundling local sin Docker
      },
      environment: {
        DYNAMODB_TABLE_CACHE: cacheTable.tableName, // softtek-cache
        DYNAMODB_TABLE_DATA: dataTable.tableName, // softtek-data
        DYNAMODB_TABLE_USUARIOS: usuariosTable.tableName, // softtek-usuarios
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
        NODE_ENV: "production",
        FREE_TIER_MODE: "true",
        CACHE_TTL_SECONDS: "1800",
        LOG_LEVEL: "info",
      },
      timeout: cdk.Duration.seconds(120),
      memorySize: 192, // Optimizado para Free Tier
    };

    // Lambda Functions
    const healthFunction = new NodejsFunction(this, "HealthFunction", {
      ...commonLambdaProps,
      functionName: "softtek-health",
      entry: "./src/handlers/health.ts",
      description: "Health check endpoint",
    });

    const swaggerFunction = new NodejsFunction(this, "SwaggerFunction", {
      ...commonLambdaProps,
      functionName: "softtek-swagger",
      entry: "./src/handlers/swagger.ts",
      description: "Swagger UI documentation endpoint",
    });

    // Funciones principales
    const fusionadosFunction = new NodejsFunction(this, "FusionadosFunction", {
      ...commonLambdaProps,
      functionName: "softtek-fusionados",
      entry: "./src/handlers/fusionados.ts",
      description: "Obtener datos fusionados con APIs externas",
    });

    const almacenarFunction = new NodejsFunction(this, "AlmacenarFunction", {
      ...commonLambdaProps,
      functionName: "softtek-almacenar",
      entry: "./src/handlers/almacenar.ts",
      description: "Almacenar datos con integración externa",
    });

    const historialFunction = new NodejsFunction(this, "HistorialFunction", {
      ...commonLambdaProps,
      functionName: "softtek-historial",
      entry: "./src/handlers/historial.ts",
      description: "Obtener historial con integración externa",
    });

    const registroFunction = new NodejsFunction(this, "RegistroFunction", {
      ...commonLambdaProps,
      functionName: "softtek-registro",
      entry: "./src/handlers/usuario-registro.ts",
      description: "Registro público de usuarios en Cognito y DynamoDB",
    });

    const loginFunction = new NodejsFunction(this, "LoginFunction", {
      ...commonLambdaProps,
      functionName: "softtek-login",
      entry: "./src/handlers/usuario-login.ts",
      description: "Login público de usuarios para obtener JWT token",
    });

    // Lambda Authorizer personalizado
    const authorizerFunction = new NodejsFunction(this, "AuthorizerFunction", {
      ...commonLambdaProps,
      functionName: "softtek-authorizer",
      entry: "./src/handlers/cognito-authorizer.ts",
      description: "Lambda Authorizer personalizado para validar tokens de Cognito",
      timeout: cdk.Duration.seconds(30), // Timeout más corto para authorizer
    });

    // Dar permisos de DynamoDB a las funciones
    const functionsNeedingDynamoDB = [
      fusionadosFunction,
      almacenarFunction,
      historialFunction,
      registroFunction,
    ];
    functionsNeedingDynamoDB.forEach((func) => {
      cacheTable.grantReadWriteData(func); // Cache temporal
      dataTable.grantReadWriteData(func); // Historial de datos fusionados
      usuariosTable.grantReadWriteData(func); // Datos de usuarios
    });

    // Dar permisos de Cognito a la función de registro
    registroFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminGetUser",
        ],
        resources: [userPool.userPoolArn],
      })
    );

    // Dar permisos de Cognito a la función de login
    loginFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cognito-idp:InitiateAuth"],
        resources: [userPool.userPoolArn],
      })
    );

    // Agregar variable de entorno del UserPoolClient a la función de login
    loginFunction.addEnvironment("COGNITO_USER_POOL_CLIENT_ID", userPoolClient.userPoolClientId);

    // Lambda Authorizer personalizado (reemplaza CognitoUserPoolsAuthorizer)
    const auth = new apigateway.TokenAuthorizer(this, "LambdaAuthorizer", {
      handler: authorizerFunction,
      identitySource: apigateway.IdentitySource.header("Authorization"),
      authorizerName: "LambdaAuthorizer",
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    // API Gateway
    const api = new apigateway.RestApi(this, "SofttekApi", {
      restApiName: "softtek-backend-challenge-api",
      description: "API para Softtek Backend Challenge - Integración con Star Wars API",
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
          "X-Amz-User-Agent",
        ],
        allowCredentials: true,
      },
    });

    // Endpoints públicos (sin autenticación)
    const healthIntegration = new apigateway.LambdaIntegration(healthFunction);
    const swaggerIntegration = new apigateway.LambdaIntegration(swaggerFunction);
    const registroIntegration = new apigateway.LambdaIntegration(registroFunction);
    const loginIntegration = new apigateway.LambdaIntegration(loginFunction);

    api.root.addResource("health").addMethod("GET", healthIntegration);

    const docsResource = api.root.addResource("docs");
    docsResource.addMethod("GET", swaggerIntegration);
    docsResource.addResource("{proxy+}").addMethod("GET", swaggerIntegration);

    // Endpoint público para registro de usuarios
    api.root.addResource("registro").addMethod("POST", registroIntegration);

    // Endpoint público para login de usuarios
    api.root.addResource("login").addMethod("POST", loginIntegration);

    // Endpoints protegidos (con autenticación Cognito)
    const fusionadosIntegration = new apigateway.LambdaIntegration(fusionadosFunction);
    const almacenarIntegration = new apigateway.LambdaIntegration(almacenarFunction);
    const historialIntegration = new apigateway.LambdaIntegration(historialFunction);

    api.root.addResource("fusionados").addMethod("GET", fusionadosIntegration, {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    api.root.addResource("almacenar").addMethod("POST", almacenarIntegration, {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    api.root.addResource("historial").addMethod("GET", historialIntegration, {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    // Outputs
    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      description: "URL del API Gateway",
      value: api.url,
      exportName: "SofttekApiUrl",
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      description: "ID del Cognito User Pool",
      value: userPool.userPoolId,
      exportName: "SofttekUserPoolId",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      description: "ID del Cognito User Pool Client",
      value: userPoolClient.userPoolClientId,
      exportName: "SofttekUserPoolClientId",
    });

    new cdk.CfnOutput(this, "DataTableName", {
      description: "Nombre de la tabla DynamoDB de datos",
      value: dataTable.tableName,
      exportName: "SofttekDataTableName",
    });

    new cdk.CfnOutput(this, "CacheTableName", {
      description: "Nombre de la tabla DynamoDB de cache",
      value: cacheTable.tableName,
      exportName: "SofttekCacheTableName",
    });

    new cdk.CfnOutput(this, "UsuariosTableName", {
      description: "Nombre de la tabla DynamoDB de usuarios",
      value: usuariosTable.tableName,
      exportName: "SofttekUsuariosTableName",
    });
  }
}

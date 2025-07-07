import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class SofttekBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const dataTable = new dynamodb.Table(this, 'DataTable', {
      tableName: 'softtek-data',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Para POC
      pointInTimeRecovery: true,
    });

    // Global Secondary Index para categoría y fecha
    dataTable.addGlobalSecondaryIndex({
      indexName: 'categoria-fecha-index',
      partitionKey: {
        name: 'categoria',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'fechaCreacion',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Tabla de Cache con TTL
    const cacheTable = new dynamodb.Table(this, 'CacheTable', {
      tableName: 'softtek-cache',
      partitionKey: {
        name: 'cacheKey',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Para POC
      timeToLiveAttribute: 'ttl',
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'SofttekUserPool', {
      userPoolName: 'softtek-backend-challenge-user-pool',
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
        fullname: {
          required: true,
          mutable: true,
        },
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Para POC
    });

    // Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'SofttekUserPoolClient', {
      userPool,
      userPoolClientName: 'softtek-backend-challenge-client',
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      accessTokenValidity: cdk.Duration.minutes(60),
      idTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
    });

    // Lambda Layer para dependencias comunes
    const commonLayer = new lambda.LayerVersion(this, 'CommonLayer', {
      code: lambda.Code.fromAsset('./src'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Common dependencies for Softtek Backend Challenge',
    });

    // Configuración común para todas las Lambdas
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      layers: [commonLayer],
      environment: {
        DYNAMODB_TABLE_DATA: dataTable.tableName,
        DYNAMODB_TABLE_CACHE: cacheTable.tableName,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        NODE_ENV: 'production',
        FREE_TIER_MODE: 'true',
        CACHE_TTL_SECONDS: '1800',
        LOG_LEVEL: 'info',
      },
      timeout: cdk.Duration.seconds(120),
      memorySize: 192, // Optimizado para Free Tier
    };

    // Lambda Functions
    const healthFunction = new lambda.Function(this, 'HealthFunction', {
      ...commonLambdaProps,
      functionName: 'softtek-health',
      code: lambda.Code.fromAsset('./src'),
      handler: 'handlers/health.handler',
      description: 'Health check endpoint',
    });

    const swaggerFunction = new lambda.Function(this, 'SwaggerFunction', {
      ...commonLambdaProps,
      functionName: 'softtek-swagger',
      code: lambda.Code.fromAsset('./src'),
      handler: 'handlers/swagger.handler',
      description: 'Swagger UI documentation endpoint',
    });

    // Funciones principales
    const fusionadosFunction = new lambda.Function(this, 'FusionadosFunction', {
      ...commonLambdaProps,
      functionName: 'softtek-fusionados',
      code: lambda.Code.fromAsset('./src'),
      handler: 'modules/fusionados/controllers/fusionados.controller.handler',
      description: 'Obtener datos fusionados con APIs externas',
    });

    const almacenarFunction = new lambda.Function(this, 'AlmacenarFunction', {
      ...commonLambdaProps,
      functionName: 'softtek-almacenar',
      code: lambda.Code.fromAsset('./src'),
      handler: 'modules/almacenar/controllers/almacenar.controller.handler',
      description: 'Almacenar datos con integración externa',
    });

    const historialFunction = new lambda.Function(this, 'HistorialFunction', {
      ...commonLambdaProps,
      functionName: 'softtek-historial',
      code: lambda.Code.fromAsset('./src'),
      handler: 'modules/historial/controllers/historial.controller.handler',
      description: 'Obtener historial con integración externa',
    });

    // Dar permisos de DynamoDB a las funciones
    const functionsNeedingDynamoDB = [
      fusionadosFunction,
      almacenarFunction,
      historialFunction
    ];
    functionsNeedingDynamoDB.forEach(func => {
      dataTable.grantReadWriteData(func);
      cacheTable.grantReadWriteData(func);
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'SofttekApi', {
      restApiName: 'softtek-backend-challenge-api',
      description: 'API para Softtek Backend Challenge - Integración con Star Wars API',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowCredentials: true,
      },
    });

    // Cognito Authorizer
    const auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'CognitoAuthorizer',
      identitySource: 'method.request.header.Authorization',
    });

    // Endpoints públicos (sin autenticación)
    const healthIntegration = new apigateway.LambdaIntegration(healthFunction);
    const swaggerIntegration = new apigateway.LambdaIntegration(swaggerFunction);

    api.root.addResource('health').addMethod('GET', healthIntegration);

    const docsResource = api.root.addResource('docs');
    docsResource.addMethod('GET', swaggerIntegration);
    docsResource.addResource('{proxy+}').addMethod('GET', swaggerIntegration);

    // Endpoints protegidos (con autenticación Cognito)
    const fusionadosIntegration = new apigateway.LambdaIntegration(fusionadosFunction);
    const almacenarIntegration = new apigateway.LambdaIntegration(almacenarFunction);
    const historialIntegration = new apigateway.LambdaIntegration(historialFunction);

    api.root.addResource('fusionados').addMethod('GET', fusionadosIntegration, {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    api.root.addResource('almacenar').addMethod('POST', almacenarIntegration, {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    api.root.addResource('historial').addMethod('GET', historialIntegration, {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      description: 'URL del API Gateway',
      value: api.url,
      exportName: 'SofttekApiUrl',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      description: 'ID del Cognito User Pool',
      value: userPool.userPoolId,
      exportName: 'SofttekUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      description: 'ID del Cognito User Pool Client',
      value: userPoolClient.userPoolClientId,
      exportName: 'SofttekUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'DataTableName', {
      description: 'Nombre de la tabla DynamoDB de datos',
      value: dataTable.tableName,
      exportName: 'SofttekDataTableName',
    });

    new cdk.CfnOutput(this, 'CacheTableName', {
      description: 'Nombre de la tabla DynamoDB de cache',
      value: cacheTable.tableName,
      exportName: 'SofttekCacheTableName',
    });
  }
}

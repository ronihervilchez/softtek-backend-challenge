import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ExternalApiServiceImpl } from '../../external-services/external-api.service';
import { ResponseUtil } from '../../../utils/response.util';

/**
 * Controlador para demostrar el uso del cache con APIs externas
 */
export class ExternalApiController {
  private readonly externalApiService: ExternalApiServiceImpl;

  constructor() {
    this.externalApiService = new ExternalApiServiceImpl();
  }

  /**
   * Obtiene personas de la API externa (con cache automático de 30 min)
   */
  async getPeople(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('📋 Solicitando personas desde API externa...');
      const startTime = Date.now();
      
      const people = await this.externalApiService.getPeople();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️ Tiempo de respuesta: ${responseTime}ms`);
      
      return ResponseUtil.lambdaResponse(200, ResponseUtil.success({
        data: people,
        count: people.length,
        cached: responseTime < 1000, // Si es muy rápido, probablemente vino del cache
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Error al obtener personas:', error);
      return ResponseUtil.lambdaResponse(500, ResponseUtil.error(
        [`Error al obtener personas: ${error}`],
        'Error en API externa'
      ));
    }
  }

  /**
   * Obtiene planetas de la API externa (con cache automático de 30 min)
   */
  async getPlanets(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('🪐 Solicitando planetas desde API externa...');
      const startTime = Date.now();
      
      const planets = await this.externalApiService.getPlanets();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️ Tiempo de respuesta: ${responseTime}ms`);
      
      return ResponseUtil.lambdaResponse(200, ResponseUtil.success({
        data: planets,
        count: planets.length,
        cached: responseTime < 1000,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Error al obtener planetas:', error);
      return ResponseUtil.lambdaResponse(500, ResponseUtil.error(
        [`Error al obtener planetas: ${error}`],
        'Error en API externa'
      ));
    }
  }

  /**
   * Obtiene películas de la API externa (con cache automático de 30 min)
   */
  async getFilms(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('🎬 Solicitando películas desde API externa...');
      const startTime = Date.now();
      
      const films = await this.externalApiService.getFilms();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️ Tiempo de respuesta: ${responseTime}ms`);
      
      return ResponseUtil.lambdaResponse(200, ResponseUtil.success({
        data: films,
        count: films.length,
        cached: responseTime < 1000,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Error al obtener películas:', error);
      return ResponseUtil.lambdaResponse(500, ResponseUtil.error(
        [`Error al obtener películas: ${error}`],
        'Error en API externa'
      ));
    }
  }

  /**
   * Obtiene personas SIN cache (siempre consulta la API externa)
   */
  async getPeopleNoCache(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('🌐 Solicitando personas SIN cache...');
      const startTime = Date.now();
      
      const people = await this.externalApiService.getPeopleNoCache();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️ Tiempo de respuesta (sin cache): ${responseTime}ms`);
      
      return ResponseUtil.lambdaResponse(200, ResponseUtil.success({
        data: people,
        count: people.length,
        cached: false,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Error al obtener personas sin cache:', error);
      return ResponseUtil.lambdaResponse(500, ResponseUtil.error(
        [`Error al obtener personas sin cache: ${error}`],
        'Error en API externa'
      ));
    }
  }

  /**
   * Limpia el cache de todas las APIs externas
   */
  async clearCache(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('🗑️ Limpiando cache de APIs externas...');
      
      await this.externalApiService.clearCache();
      
      return ResponseUtil.lambdaResponse(200, ResponseUtil.success({
        message: 'Cache limpiado exitosamente',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Error al limpiar cache:', error);
      return ResponseUtil.lambdaResponse(500, ResponseUtil.error(
        [`Error al limpiar cache: ${error}`],
        'Error en operación de cache'
      ));
    }
  }

  /**
   * Limpia el cache de un endpoint específico
   */
  async clearCacheForEndpoint(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      const endpoint = event.pathParameters?.endpoint as 'people' | 'planets' | 'films';
      
      if (!endpoint || !['people', 'planets', 'films'].includes(endpoint)) {
        return ResponseUtil.lambdaResponse(400, ResponseUtil.error(['Endpoint inválido. Use: people, planets, o films'], 'Parámetro inválido'));
      }
      
      console.log(`🗑️ Limpiando cache para endpoint: ${endpoint}`);
      
      await this.externalApiService.clearCacheForEndpoint(endpoint);
      
      return ResponseUtil.lambdaResponse(200, ResponseUtil.success({
        message: `Cache limpiado exitosamente para endpoint: ${endpoint}`,
        endpoint,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Error al limpiar cache del endpoint:', error);
      return ResponseUtil.lambdaResponse(500, ResponseUtil.error(
        [`Error al limpiar cache del endpoint: ${error}`],
        'Error en operación de cache'
      ));
    }
  }
}

// Instancia del controlador
const controller = new ExternalApiController();

// Handlers para serverless
export const getPeople = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return controller.getPeople(event, context);
};

export const getPlanets = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return controller.getPlanets(event, context);
};

export const getFilms = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return controller.getFilms(event, context);
};

export const getPeopleNoCache = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return controller.getPeopleNoCache(event, context);
};

export const clearCache = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return controller.clearCache(event, context);
};

export const clearCacheForEndpoint = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return controller.clearCacheForEndpoint(event, context);
};

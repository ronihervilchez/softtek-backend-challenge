import { Person, Planet, Film, Response } from "./interfaces";
import { getCacheService } from "../cache";

export interface ExternalApiService {
  // Métodos principales que SIEMPRE usan cache (30 minutos)
  getPeople(headers?: Record<string, string>): Promise<Person[]>;
  getPlanets(headers?: Record<string, string>): Promise<Planet[]>;
  getFilms(headers?: Record<string, string>): Promise<Film[]>;
  
  // Métodos sin cache (para casos especiales)
  getPeopleNoCache(headers?: Record<string, string>): Promise<Person[]>;
  getPlanetsNoCache(headers?: Record<string, string>): Promise<Planet[]>;
  getFilmsNoCache(headers?: Record<string, string>): Promise<Film[]>;
  
  // Métodos para gestión de cache
  clearCache(): Promise<void>;
  clearCacheForEndpoint(endpoint: 'people' | 'planets' | 'films'): Promise<void>;
}

export class ExternalApiServiceImpl implements ExternalApiService {
  private readonly defaultHeaders: Record<string, string>;
  private readonly cacheService = getCacheService();
  private readonly CACHE_TTL = 1800; // 30 minutos en segundos

  constructor() {
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  // Métodos principales CON cache automático (30 minutos)
  
  async getPeople(headers?: Record<string, string>): Promise<Person[]> {
    const cacheKey = this.generateCacheKey('people', headers);
    
    return await this.cacheService.getOrSet(
      cacheKey,
      () => this.getPeopleNoCache(headers),
      this.CACHE_TTL
    );
  }

  async getPlanets(headers?: Record<string, string>): Promise<Planet[]> {
    const cacheKey = this.generateCacheKey('planets', headers);
    
    return await this.cacheService.getOrSet(
      cacheKey,
      () => this.getPlanetsNoCache(headers),
      this.CACHE_TTL
    );
  }

  async getFilms(headers?: Record<string, string>): Promise<Film[]> {
    const cacheKey = this.generateCacheKey('films', headers);
    
    return await this.cacheService.getOrSet(
      cacheKey,
      () => this.getFilmsNoCache(headers),
      this.CACHE_TTL
    );
  }

  // Métodos SIN cache (implementación directa a API)
  
  async getPeopleNoCache(headers?: Record<string, string>): Promise<Person[]> {
    try {
      console.log('🌐 Consultando API externa: https://swapi.info/api/people');
      
      const response = await fetch(`https://swapi.info/api/people`, {
        method: "GET",
        headers: { ...this.defaultHeaders, ...headers },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json() as Response<Person>;
      
      console.log(`✅ API externa respondió: ${json.results.length} personas obtenidas`);
      return json.results;
    } catch (error) {
      console.error('❌ Error al consultar API externa de personas:', error);
      throw new Error(`Error en GET request: ${error}`);
    }
  }

  async getPlanetsNoCache(headers?: Record<string, string>): Promise<Planet[]> {
    try {
      console.log('🌐 Consultando API externa: https://swapi.info/api/planets');
      
      const response = await fetch(`https://swapi.info/api/planets`, {
        method: "GET",
        headers: { ...this.defaultHeaders, ...headers },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json() as Response<Planet>;
      
      console.log(`✅ API externa respondió: ${json.results.length} planetas obtenidos`);
      return json.results;
    } catch (error) {
      console.error('❌ Error al consultar API externa de planetas:', error);
      throw new Error(`Error en GET request: ${error}`);
    }
  }

  async getFilmsNoCache(headers?: Record<string, string>): Promise<Film[]> {
    try {
      console.log('🌐 Consultando API externa: https://swapi.info/api/films');
      
      const response = await fetch(`https://swapi.info/api/films`, {
        method: "GET",
        headers: { ...this.defaultHeaders, ...headers },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json() as Response<Film>;
      
      console.log(`✅ API externa respondió: ${json.results.length} películas obtenidas`);
      return json.results;
    } catch (error) {
      console.error('❌ Error al consultar API externa de películas:', error);
      throw new Error(`Error en GET request: ${error}`);
    }
  }

  // Métodos para gestión de cache

  async clearCache(): Promise<void> {
    try {
      await Promise.all([
        this.clearCacheForEndpoint('people'),
        this.clearCacheForEndpoint('planets'),
        this.clearCacheForEndpoint('films')
      ]);
      console.log('🗑️ Cache de APIs externas limpiado completamente');
    } catch (error) {
      console.error('❌ Error al limpiar cache:', error);
    }
  }

  async clearCacheForEndpoint(endpoint: 'people' | 'planets' | 'films'): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(endpoint, {});
      await this.cacheService.delete(cacheKey);
      console.log(`🗑️ Cache limpiado para endpoint: ${endpoint}`);
    } catch (error) {
      console.error(`❌ Error al limpiar cache para ${endpoint}:`, error);
    }
  }

  // Métodos privados

  private generateCacheKey(endpoint: string, headers?: Record<string, string>): string {
    const headerHash = headers ? JSON.stringify(headers) : 'default';
    return this.cacheService.generateKey('external-api', endpoint, headerHash);
  }
}

import { Person, Planet, IFilm, Response, Recipe, ComidaFavorita } from "./interfaces";
import { getCacheService } from "../database/services/cache.service";

export interface ExternalApiService {
  // Métodos principales que SIEMPRE usan cache (30 minutos)
  getPeople(headers?: Record<string, string>): Promise<Person[]>;
  getPlanets(headers?: Record<string, string>): Promise<Planet[]>;
  getFilms(headers?: Record<string, string>): Promise<IFilm[]>;
  getComidaFavorita(id: number, headers?: Record<string, string>): Promise<ComidaFavorita>;
  
  // Métodos sin cache (para casos especiales)
  getPeopleNoCache(headers?: Record<string, string>): Promise<Person[]>;
  getPlanetsNoCache(headers?: Record<string, string>): Promise<Planet[]>;
  getFilmsNoCache(headers?: Record<string, string>): Promise<IFilm[]>;
  getComidaFavoritaNoCache(id: number, headers?: Record<string, string>): Promise<ComidaFavorita>;
  
  // Métodos para gestión de cache
  clearCache(): Promise<void>;
  clearCacheForEndpoint(endpoint: 'people' | 'planets' | 'films' | 'food'): Promise<void>;
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
    
    // Verificar cache primero
    const cachedData = await this.cacheService.find<Person[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Si no está en cache, obtener desde API
    const data = await this.getPeopleNoCache(headers);
    await this.cacheService.save(cacheKey, data);
    return data;
  }

  async getPlanets(headers?: Record<string, string>): Promise<Planet[]> {
    const cacheKey = this.generateCacheKey('planets', headers);
    
    // Verificar cache primero
    const cachedData = await this.cacheService.find<Planet[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Si no está en cache, obtener desde API
    const data = await this.getPlanetsNoCache(headers);
    await this.cacheService.save(cacheKey, data);
    return data;
  }

  async getFilms(headers?: Record<string, string>): Promise<IFilm[]> {
    const cacheKey = this.generateCacheKey('films', headers);
    
    // Verificar cache primero
    const cachedData = await this.cacheService.find<IFilm[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Si no está en cache, obtener desde API
    const data = await this.getFilmsNoCache(headers);
    await this.cacheService.save(cacheKey, data);
    return data;
  }

  async getComidaFavorita(id: number, headers?: Record<string, string>): Promise<ComidaFavorita> {
    const cacheKey = `external-api:food:${id}${headers ? ':' + JSON.stringify(headers) : ''}`;
    
    // Verificar cache primero
    const cachedData = await this.cacheService.find<ComidaFavorita>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Si no está en cache, obtener desde API
    const data = await this.getComidaFavoritaNoCache(id, headers);
    await this.cacheService.save(cacheKey, data);
    return data;
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

  async getFilmsNoCache(headers?: Record<string, string>): Promise<IFilm[]> {
    try {
      console.log('🌐 Consultando API externa: https://swapi.info/api/films');
      
      const response = await fetch(`https://swapi.info/api/films`, {
        method: "GET",
        headers: { ...this.defaultHeaders, ...headers },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json() as Response<IFilm>;
      
      console.log(`✅ API externa respondió: ${json.results.length} películas obtenidas`);
      return json.results;
    } catch (error) {
      console.error('❌ Error al consultar API externa de películas:', error);
      throw new Error(`Error en GET request: ${error}`);
    }
  }

  async getComidaFavoritaNoCache(id: number, headers?: Record<string, string>): Promise<ComidaFavorita> {
    try {
      console.log(`🌐 Consultando API externa: https://api.spoonacular.com/recipes/${id}/information`);
      
      // Nota: En producción, la API key debe venir de variables de entorno
      const apiKey = process.env.SPOONACULAR_API_KEY ?? 'demo-key';
      
      const response = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`, {
        method: "GET",
        headers: { ...this.defaultHeaders, ...headers },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const recipe = await response.json() as Recipe;
      
      // Transformar la respuesta de Spoonacular a nuestro formato
      const comidaFavorita: ComidaFavorita = {
        id: recipe.id,
        titulo: recipe.title,
        imagen: recipe.image,
        porciones: recipe.servings,
        tiempoPreparacion: recipe.readyInMinutes,
        puntajeSpoonacular: recipe.spoonacularScore,
        ingredientes: recipe.extendedIngredients?.map((ing: any) => ing.original) ?? [],
        instrucciones: recipe.instructions ?? '',
        resumen: recipe.summary ?? '',
        dietas: recipe.diets ?? [],
        cocinas: recipe.cuisines ?? [],
        vegano: recipe.vegan ?? false,
        vegetariano: recipe.vegetarian ?? false,
        sinGluten: recipe.glutenFree ?? false,
        saludable: recipe.veryHealthy ?? false
      };
      
      console.log(`✅ API externa respondió: Receta "${recipe.title}" obtenida`);
      return comidaFavorita;
    } catch (error) {
      console.error('❌ Error al consultar API externa de comida:', error);
      throw new Error(`Error en GET request: ${error}`);
    }
  }

  // Métodos para gestión de cache

  async clearCache(): Promise<void> {
    console.log('ℹ️ Cache clearing not supported in simplified cache service');
  }

  async clearCacheForEndpoint(endpoint: 'people' | 'planets' | 'films' | 'food'): Promise<void> {
    console.log(`ℹ️ Cache clearing not supported in simplified cache service for endpoint: ${endpoint}`);
  }

  // Métodos auxiliares privados

  private generateCacheKey(endpoint: string, headers?: Record<string, string>): string {
    const baseKey = `external-api:${endpoint}`;
    if (headers && Object.keys(headers).length > 0) {
      const headerString = Object.entries(headers)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
      return `${baseKey}:${Buffer.from(headerString).toString('base64')}`;
    }
    return baseKey;
  }
}

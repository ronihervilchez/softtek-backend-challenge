import { FusionadosRepository, FusionadosRepositoryImpl } from '../../../repositories/fusionados.repository';
import { ExternalApiService, ExternalApiServiceImpl } from '../../external-services/external-api.service';
import { FusionadosResult } from '../../../interfaces';
import { FusionadosSchema } from '../../../modules/database/schemas';
import { DatabaseServiceImpl } from '../../external-services/database.service';
import { getCacheService } from '../../database/services/cache.service';

export interface FusionadosService {
  getFusionados(filters?: Record<string, any>): Promise<FusionadosResult[]>;
  createFusionados(personas: any[], planetas: any[], peliculas: any[], usuario: string): Promise<FusionadosSchema>;
  getFusionadosById(id: string): Promise<FusionadosSchema | null>;
  generateFusionados(usuario: string): Promise<FusionadosSchema>;
}

export class FusionadosServiceImpl implements FusionadosService {
  private readonly fusionadosRepository: FusionadosRepository;
  private readonly externalApiService: ExternalApiService;
  private readonly databaseService: DatabaseServiceImpl;
  private readonly cacheService = getCacheService();

  constructor(
    fusionadosRepository?: FusionadosRepository,
    externalApiService?: ExternalApiService
  ) {
    this.fusionadosRepository = fusionadosRepository || new FusionadosRepositoryImpl();
    this.externalApiService = externalApiService || new ExternalApiServiceImpl();
    this.databaseService = new DatabaseServiceImpl();
  }

  async getFusionados(filters?: Record<string, any>): Promise<FusionadosResult[]> {
    try {
      console.log('🔄 Obteniendo datos fusionados...');
      
      // Generar clave de cache basada en los filtros
      const cacheKey = `fusionados:data:${JSON.stringify(filters || {})}`;
      
      // Verificar si los datos están en cache
      const cachedData = await this.cacheService.find<FusionadosResult[]>(cacheKey);
      if (cachedData) {
        console.log('📋 Datos obtenidos desde cache');
        return cachedData;
      }
      
      console.log('🌐 Cache miss - obteniendo datos desde APIs externas...');
      
      // Si no están en cache, obtener desde APIs externas
      const [personas, planetas, peliculas] = await Promise.all([
        this.externalApiService.getPeople(),
        this.externalApiService.getPlanets(),
        this.externalApiService.getFilms()
      ]);

      console.log(`📊 Datos externos obtenidos - Personas: ${personas.length}, Planetas: ${planetas.length}, Películas: ${peliculas.length}`);

      // Procesar y fusionar los datos
      const fusionedData: FusionadosResult[] = [];
      
      // Fusionar personas con planetas y películas
      personas.forEach(persona => {
        const homeworld = planetas.find(planet => planet.url === persona.homeworld);
        const personFilms = peliculas.filter(film => persona.films.includes(film.url));
        
        fusionedData.push({
          id: `person-${persona.url.split('/')[5]}`,
          data: {
            id: `person-${persona.url.split('/')[5]}`,
            nombre: persona.name,
            fecha: new Date().toISOString(),
            datos: {
              tipo: 'person',
              detalles: persona,
              homeworld: homeworld ? {
                name: homeworld.name,
                climate: homeworld.climate,
                terrain: homeworld.terrain
              } : null,
              films: personFilms.map(film => ({
                title: film.title,
                episode_id: film.episode_id,
                release_date: film.release_date
              }))
            },
            usuario: 'system',
            procesado: true,
            timestamp: new Date().toISOString()
          },
          procesado: true,
          timestamp: new Date().toISOString()
        });
      });

      // Agregar datos de planetas
      planetas.forEach(planeta => {
        const planetResidents = personas.filter(person => person.homeworld === planeta.url);
        const planetFilms = peliculas.filter(film => planeta.films.includes(film.url));
        
        fusionedData.push({
          id: `planet-${planeta.url.split('/')[5]}`,
          data: {
            id: `planet-${planeta.url.split('/')[5]}`,
            nombre: planeta.name,
            fecha: new Date().toISOString(),
            datos: {
              tipo: 'planet',
              detalles: planeta,
              residents: planetResidents.map(resident => ({
                name: resident.name,
                species: resident.species,
                gender: resident.gender
              })),
              films: planetFilms.map(film => ({
                title: film.title,
                episode_id: film.episode_id,
                release_date: film.release_date
              }))
            },
            usuario: 'system',
            procesado: true,
            timestamp: new Date().toISOString()
          },
          procesado: true,
          timestamp: new Date().toISOString()
        });
      });

      // Aplicar filtros si existen
      let filteredData = fusionedData;
      if (filters?.limit) {
        filteredData = fusionedData.slice(0, parseInt(filters.limit));
      }
      
      // Guardar en cache por 30 minutos
      await this.cacheService.save(cacheKey, filteredData);
      
      console.log(`✅ Datos fusionados procesados: ${filteredData.length} elementos`);
      return filteredData;
      
    } catch (error) {
      console.error(`❌ Error en el servicio de fusionados:`, error);
      throw new Error(`Error en el servicio de fusionados: ${error}`);
    }
  }

  async generateFusionados(usuario: string): Promise<FusionadosSchema> {
    try {
      console.log('🌐 Generando datos fusionados desde APIs externas...');
      
      // Obtener datos de APIs externas en paralelo
      const [personas, planetas, peliculas] = await Promise.all([
        this.externalApiService.getPeople(),
        this.externalApiService.getPlanets(),
        this.externalApiService.getFilms()
      ]);

      console.log(`📊 Datos obtenidos - Personas: ${personas.length}, Planetas: ${planetas.length}, Películas: ${peliculas.length}`);

      // Crear registro fusionado
      const fusionadosRecord = await this.createFusionados(personas, planetas, peliculas, usuario);
      
      console.log(`✅ Datos fusionados generados exitosamente: ${fusionadosRecord.id}`);
      return fusionadosRecord;
    } catch (error) {
      console.error(`❌ Error al generar datos fusionados:`, error);
      throw new Error(`Error al generar datos fusionados: ${error}`);
    }
  }

  async createFusionados(
    personas: any[], 
    planetas: any[], 
    peliculas: any[], 
    usuario: string
  ): Promise<FusionadosSchema> {
    try {
      const fusionadosRecord = await this.fusionadosRepository.createFusionados(
        personas, 
        planetas, 
        peliculas, 
        usuario
      );

      console.log(`✅ Fusionados creados en servicio: ${fusionadosRecord.id}`);
      return fusionadosRecord;
    } catch (error) {
      console.error(`❌ Error al crear fusionados en servicio:`, error);
      throw new Error(`Error al crear fusionados: ${error}`);
    }
  }

  async getFusionadosById(id: string): Promise<FusionadosSchema | null> {
    try {
      const cacheKey = `fusionados:id:${id}`;
      
      // Verificar cache primero
      const cachedRecord = await this.cacheService.find<FusionadosSchema>(cacheKey);
      if (cachedRecord) {
        console.log(`📖 Fusionados obtenidos por ID desde cache: ${id}`);
        return cachedRecord;
      }
      
      // Si no está en cache, obtener desde base de datos
      const record = await this.fusionadosRepository.getFusionadosById(id);
      
      if (record) {
        console.log(`📖 Fusionados obtenidos por ID desde BD: ${id}`);
        // Guardar en cache
        await this.cacheService.save(cacheKey, record);
      } else {
        console.log(`⚠️ No se encontraron fusionados con ID: ${id}`);
      }
      
      return record;
    } catch (error) {
      console.error(`❌ Error al obtener fusionados por ID en servicio:`, error);
      throw new Error(`Error al obtener fusionados: ${error}`);
    }
  }
}

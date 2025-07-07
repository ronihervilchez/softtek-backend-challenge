import { HistorialRepository, HistorialRepositoryImpl } from '../repositories/historial.repository';
import { HistorialResult } from '../../../interfaces';
import { ExternalApiService, ExternalApiServiceImpl } from '../../external-services/external-api.service';
import { DatabaseServiceImpl } from '../../external-services/database.service';
import { getCacheService } from '../../database/services/cache.service';

export interface HistorialService {
  getHistorial(filters?: Record<string, any>): Promise<HistorialResult[]>;
  getHistorialWithExternalData(filters?: Record<string, any>): Promise<HistorialResult[]>;
}

export class HistorialServiceImpl implements HistorialService {
  private readonly historialRepository: HistorialRepository;
  private readonly externalApiService: ExternalApiService;
  private readonly databaseService: DatabaseServiceImpl;
  private readonly cacheService = getCacheService();

  constructor(
    historialRepository?: HistorialRepository,
    externalApiService?: ExternalApiService
  ) {
    this.historialRepository = historialRepository || new HistorialRepositoryImpl();
    this.externalApiService = externalApiService || new ExternalApiServiceImpl();
    this.databaseService = new DatabaseServiceImpl();
  }

  async getHistorial(filters?: Record<string, any>): Promise<HistorialResult[]> {
    try {
      console.log('📋 Obteniendo historial...');
      
      // Generar clave de cache basada en los filtros
      const cacheKey = `historial:data:${JSON.stringify(filters || {})}`;
      
      // Verificar si los datos están en cache
      const cachedData = await this.cacheService.find<HistorialResult[]>(cacheKey);
      if (cachedData) {
        console.log('📋 Historial obtenido desde cache');
        return cachedData;
      }
      
      console.log('🌐 Cache miss - obteniendo datos desde APIs externas...');
      
      // Si no están en cache, obtener desde APIs externas para crear historial enriquecido
      const [people, planets, films] = await Promise.all([
        this.externalApiService.getPeople(),
        this.externalApiService.getPlanets(),
        this.externalApiService.getFilms()
      ]);

      console.log(`📊 Datos externos obtenidos - Personas: ${people.length}, Planetas: ${planets.length}, Películas: ${films.length}`);

      // Generar historial basado en los datos externos
      const historialData: HistorialResult[] = [];
      
      // Crear entradas de historial para personas
      people.slice(0, 10).forEach((person, index) => {
        historialData.push({
          id: Date.now() + index,
          accion: 'consulta_persona',
          usuario: 'sistema',
          fecha: new Date().toISOString(),
          fechaFormateada: new Date().toLocaleDateString('es-ES'),
          detalles: {
            tipo: 'person',
            nombre: person.name,
            url: person.url,
            homeworld: person.homeworld,
            films: person.films.length,
            especies: person.species.length,
            vehiculos: person.vehicles.length,
            naves: person.starships.length
          },
          procesado: true
        });
      });
      
      // Crear entradas de historial para planetas
      planets.slice(0, 5).forEach((planet, index) => {
        historialData.push({
          id: Date.now() + 1000 + index,
          accion: 'consulta_planeta',
          usuario: 'sistema',
          fecha: new Date().toISOString(),
          fechaFormateada: new Date().toLocaleDateString('es-ES'),
          detalles: {
            tipo: 'planet',
            nombre: planet.name,
            url: planet.url,
            clima: planet.climate,
            terreno: planet.terrain,
            poblacion: planet.population,
            residentes: planet.residents.length,
            peliculas: planet.films.length
          },
          procesado: true
        });
      });
      
      // Crear entradas de historial para películas
      films.slice(0, 5).forEach((film, index) => {
        historialData.push({
          id: Date.now() + 2000 + index,
          accion: 'consulta_pelicula',
          usuario: 'sistema',
          fecha: new Date().toISOString(),
          fechaFormateada: new Date().toLocaleDateString('es-ES'),
          detalles: {
            tipo: 'film',
            titulo: film.title,
            episodio: film.episode_id,
            url: film.url,
            director: film.director,
            productor: film.producer,
            fecha_estreno: film.release_date,
            personajes: film.characters.length,
            planetas: film.planets.length,
            especies: film.species.length
          },
          procesado: true
        });
      });

      // Aplicar filtros si existen
      let filteredData = historialData;
      if (filters?.accion) {
        filteredData = historialData.filter(item => 
          item.accion.includes(filters.accion.toLowerCase())
        );
      }
      if (filters?.limit) {
        filteredData = filteredData.slice(0, parseInt(filters.limit));
      }
      
      // Ordenar por fecha descendente
      filteredData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      // Guardar en cache por 30 minutos
      await this.cacheService.save(cacheKey, filteredData);
      
      console.log(`✅ Historial procesado: ${filteredData.length} registros`);
      return filteredData;
      
    } catch (error) {
      console.error(`❌ Error en el servicio de historial:`, error);
      throw new Error(`Error en el servicio de historial: ${error}`);
    }
  }

  async getHistorialWithExternalData(filters?: Record<string, any>): Promise<HistorialResult[]> {
    try {
      // Obtener historial local
      const historialLocal = await this.getHistorial(filters);
      
      // Obtener datos adicionales de APIs externas si es necesario
      const [people, planets, films] = await Promise.all([
        this.externalApiService.getPeople(),
        this.externalApiService.getPlanets(),
        this.externalApiService.getFilms()
      ]);
      
      // Enriquecer los datos del historial con información externa
      const enrichedHistorial = historialLocal.map(item => ({
        ...item,
        externalData: {
          totalPeople: people.length,
          totalPlanets: planets.length,
          totalFilms: films.length,
          lastUpdate: new Date().toISOString()
        }
      }));
      
      return enrichedHistorial;
    } catch (error) {
      throw new Error(`Error en el servicio de historial con datos externos: ${error}`);
    }
  }
}

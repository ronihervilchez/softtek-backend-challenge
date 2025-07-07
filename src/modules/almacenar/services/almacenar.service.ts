import { AlmacenarRepository, AlmacenarRepositoryImpl } from '../repositories/almacenar.repository';
import { AlmacenarDto } from '../dtos/almacenar.dto';
import { AlmacenarResult } from '../../../interfaces';
import { DatabaseServiceImpl } from '../../external-services/database.service';
import { DynamoDBRecord } from '../../../interfaces/dynamodb.interface';
import { getCacheService } from '../../database/services/cache.service';
import { ExternalApiService, ExternalApiServiceImpl } from '../../external-services/external-api.service';

export interface AlmacenarService {
  almacenar(data: AlmacenarDto): Promise<AlmacenarResult>;
  obtenerPorId(id: string): Promise<DynamoDBRecord | null>;
  obtenerPorCategoria(categoria: string): Promise<DynamoDBRecord[]>;
}

export class AlmacenarServiceImpl implements AlmacenarService {
  private readonly almacenarRepository: AlmacenarRepository;
  private readonly databaseService: DatabaseServiceImpl;
  private readonly externalApiService: ExternalApiService;
  private readonly cacheService = getCacheService();

  constructor(
    almacenarRepository?: AlmacenarRepository,
    externalApiService?: ExternalApiService
  ) {
    this.almacenarRepository = almacenarRepository || new AlmacenarRepositoryImpl();
    this.databaseService = new DatabaseServiceImpl();
    this.externalApiService = externalApiService || new ExternalApiServiceImpl();
  }

  async almacenar(data: AlmacenarDto): Promise<AlmacenarResult> {
    try {
      console.log('📥 Procesando datos para almacenar...');
      
      // Generar clave de cache basada en los datos a almacenar
      const cacheKey = `almacenar:data:${JSON.stringify(data)}`;
      
      // Verificar si los datos ya están en cache
      const cachedData = await this.cacheService.find<AlmacenarResult>(cacheKey);
      if (cachedData) {
        console.log('📋 Datos encontrados en cache - retornando resultado existente');
        return cachedData;
      }
      
      console.log('🌐 Cache miss - enriqueciendo datos con APIs externas...');
      
      // Obtener datos adicionales desde APIs externas basado en la categoría
      let externalData = null;
      if (data.categoria) {
        switch (data.categoria.toLowerCase()) {
          case 'people':
          case 'persona':
          case 'character':
            externalData = await this.externalApiService.getPeople();
            break;
          case 'planet':
          case 'planeta':
            externalData = await this.externalApiService.getPlanets();
            break;
          case 'film':
          case 'movie':
          case 'pelicula':
            externalData = await this.externalApiService.getFilms();
            break;
          default:
            console.log('ℹ️ Categoría no reconocida, continuando sin datos externos');
        }
      }
      
      // Procesar y enriquecer los datos
      const enrichedData = {
        ...data,
        externalData: externalData ? externalData.slice(0, 5) : null, // Limitar a 5 elementos
        procesado: true,
        fechaProcesamiento: new Date().toISOString(),
        source: 'api_externa'
      };

      // Crear registro para DynamoDB
      const record: DynamoDBRecord = {
        id: `almacenar-${Date.now()}`,
        categoria: data.categoria || 'general',
        fechaCreacion: new Date().toISOString(),
        nombre: data.nombre,
        datos: enrichedData,
        usuario: 'sistema',
        procesado: true,
        timestamp: Date.now(),
      };

      // Guardar en DynamoDB
      const savedRecord = await this.databaseService.put(record);

      const result: AlmacenarResult = {
        id: savedRecord.id,
        mensaje: 'Datos almacenados exitosamente con información externa',
        datos: enrichedData,
        timestamp: savedRecord.timestamp,
        externalDataCount: externalData ? externalData.length : 0
      };
      
      // Guardar resultado en cache por 30 minutos
      await this.cacheService.save(cacheKey, result);
      
      console.log(`✅ Datos almacenados exitosamente: ${result.id}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Error en el servicio de almacenamiento:`, error);
      throw new Error(`Error en el servicio de almacenamiento: ${error}`);
    }
  }

  async obtenerPorId(id: string): Promise<DynamoDBRecord | null> {
    try {
      const cacheKey = `almacenar:id:${id}`;
      
      // Verificar cache primero
      const cachedRecord = await this.cacheService.find<DynamoDBRecord>(cacheKey);
      if (cachedRecord) {
        return cachedRecord;
      }
      
      // Si no está en cache, obtener desde base de datos
      const record = await this.databaseService.get(id);
      if (record) {
        await this.cacheService.save(cacheKey, record);
      }
      
      return record;
    } catch (error) {
      throw new Error(`Error al obtener registro por ID: ${error}`);
    }
  }

  async obtenerPorCategoria(categoria: string): Promise<DynamoDBRecord[]> {
    try {
      const cacheKey = `almacenar:categoria:${categoria}`;
      
      // Verificar cache primero
      const cachedRecords = await this.cacheService.find<DynamoDBRecord[]>(cacheKey);
      if (cachedRecords) {
        return cachedRecords;
      }
      
      // Si no está en cache, obtener desde base de datos
      const records = await this.databaseService.query(categoria);
      if (records.length > 0) {
        await this.cacheService.save(cacheKey, records);
      }
      
      return records;
    } catch (error) {
      throw new Error(`Error al obtener registros por categoría: ${error}`);
    }
  }
}

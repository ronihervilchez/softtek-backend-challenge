import { AlmacenarRepository, AlmacenarRepositoryImpl } from '../repositories/almacenar.repository';
import { AlmacenarDto } from '../dtos/almacenar.dto';
import { AlmacenarResult } from '../../../interfaces';
import { DatabaseServiceImpl } from '../../external-services/database.service';
import { DynamoDBRecord } from '../../../interfaces/dynamodb.interface';
import { getCacheService } from '../../external-services/cache.service';

export interface AlmacenarService {
  almacenar(data: AlmacenarDto): Promise<AlmacenarResult>;
  obtenerPorId(id: string): Promise<DynamoDBRecord | null>;
  obtenerPorCategoria(categoria: string): Promise<DynamoDBRecord[]>;
}

export class AlmacenarServiceImpl implements AlmacenarService {
  private readonly almacenarRepository: AlmacenarRepository;
  private readonly databaseService: DatabaseServiceImpl;
  private readonly cacheService = getCacheService();

  constructor(almacenarRepository?: AlmacenarRepository) {
    this.almacenarRepository = almacenarRepository || new AlmacenarRepositoryImpl();
    this.databaseService = new DatabaseServiceImpl();
  }

  async almacenar(data: AlmacenarDto): Promise<AlmacenarResult> {
    try {
      // Lógica de negocio aquí
      // Validaciones adicionales si es necesario
      if (!data.nombre || !data.descripcion) {
        throw new Error('Nombre y descripción son requeridos');
      }

      // Procesar los datos antes de almacenar
      const processedData = {
        ...data,
        procesado: true,
        fechaProcesamiento: new Date().toISOString(),
      };

      // Crear registro para DynamoDB
      const record: DynamoDBRecord = {
        id: Date.now().toString(),
        categoria: 'almacenar',
        fechaCreacion: new Date().toISOString(),
        nombre: data.nombre,
        datos: processedData,
        usuario: 'sistema', // En un caso real, obtener del contexto de autenticación
        procesado: true,
        timestamp: Date.now(),
      };

      // Guardar en DynamoDB
      const savedRecord = await this.databaseService.put(record);

      // Invalidar cache relacionado
      await this.cacheService.delete(
        this.cacheService.generateKey('almacenar', 'categoria', 'almacenar')
      );

      const result = await this.almacenarRepository.almacenar(processedData);
      return {
        ...result,
        id: savedRecord.id,
        timestamp: savedRecord.timestamp,
      };
    } catch (error) {
      throw new Error(`Error en el servicio de almacenamiento: ${error}`);
    }
  }

  async obtenerPorId(id: string): Promise<DynamoDBRecord | null> {
    try {
      const cacheKey = this.cacheService.generateKey('almacenar', 'id', id);
      
      return await this.cacheService.getOrSet(
        cacheKey,
        () => this.databaseService.get(id),
        1800 // 30 minutos de cache
      );
    } catch (error) {
      throw new Error(`Error al obtener registro por ID: ${error}`);
    }
  }

  async obtenerPorCategoria(categoria: string): Promise<DynamoDBRecord[]> {
    try {
      const cacheKey = this.cacheService.generateKey('almacenar', 'categoria', categoria);
      
      return await this.cacheService.getOrSet(
        cacheKey,
        () => this.databaseService.query(categoria),
        900 // 15 minutos de cache
      );
    } catch (error) {
      throw new Error(`Error al obtener registros por categoría: ${error}`);
    }
  }
}

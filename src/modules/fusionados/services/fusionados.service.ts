import { FusionadosRepository, FusionadosRepositoryImpl } from '../../../repositories/fusionados.repository';
import { FusionadosResult } from '../../../interfaces';
import { FusionadosSchema } from '../../../modules/database/schemas';

export interface FusionadosService {
  getFusionados(filters?: Record<string, any>): Promise<FusionadosResult[]>;
  createFusionados(personas: any[], planetas: any[], peliculas: any[], usuario: string): Promise<FusionadosSchema>;
  getFusionadosById(id: string): Promise<FusionadosSchema | null>;
}

export class FusionadosServiceImpl implements FusionadosService {
  private readonly fusionadosRepository: FusionadosRepository;

  constructor(fusionadosRepository?: FusionadosRepository) {
    this.fusionadosRepository = fusionadosRepository || new FusionadosRepositoryImpl();
  }

  async getFusionados(filters?: Record<string, any>): Promise<FusionadosResult[]> {
    try {
      // Convertir filtros genéricos a filtros específicos
      const specificFilters = {
        categoria: 'fusionados',
        fechaInicio: filters?.fechaInicio,
        fechaFin: filters?.fechaFin,
        limit: filters?.limit
      };

      const data = await this.fusionadosRepository.getFusionados(specificFilters);
      
      // Transformar datos del esquema a formato de resultado
      return data.map((item) => ({
        id: item.id,
        data: {
          id: item.id,
          nombre: item.nombre,
          fecha: item.fechaCreacion,
          datos: item.datos,
          usuario: item.usuario,
          procesado: item.procesado,
          timestamp: item.timestamp
        },
        procesado: item.procesado,
        timestamp: item.fechaCreacion,
      }));
    } catch (error) {
      console.error(`❌ Error en el servicio de fusionados:`, error);
      throw new Error(`Error en el servicio de fusionados: ${error}`);
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
      const record = await this.fusionadosRepository.getFusionadosById(id);
      
      if (record) {
        console.log(`📖 Fusionados obtenidos por ID en servicio: ${id}`);
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

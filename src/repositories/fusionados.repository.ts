import { getDatabaseService } from '../modules/database';
import { FusionadosSchema, SchemaFactory } from '../modules/database/schemas';

export interface FusionadosRepository {
  getFusionados(filters?: { categoria?: string; fechaInicio?: string; fechaFin?: string; limit?: number }): Promise<FusionadosSchema[]>;
  createFusionados(personas: any[], planetas: any[], peliculas: any[], usuario: string): Promise<FusionadosSchema>;
  getFusionadosById(id: string): Promise<FusionadosSchema | null>;
  updateFusionados(id: string, updates: Partial<FusionadosSchema>): Promise<FusionadosSchema>;
  deleteFusionados(id: string): Promise<boolean>;
}

export class FusionadosRepositoryImpl implements FusionadosRepository {
  private readonly databaseService = getDatabaseService();

  async getFusionados(filters?: { 
    categoria?: string; 
    fechaInicio?: string; 
    fechaFin?: string; 
    limit?: number 
  }): Promise<FusionadosSchema[]> {
    try {
      let registros: FusionadosSchema[] = [];

      if (filters?.fechaInicio && filters?.fechaFin) {
        // Buscar por rango de fechas
        const allRecords = await this.databaseService.findByDateRange(
          filters.fechaInicio, 
          filters.fechaFin
        );
        registros = allRecords.filter(record => record.categoria === 'fusionados') as FusionadosSchema[];
      } else {
        // Buscar por categoría
        const records = await this.databaseService.findByCategory('fusionados', filters?.limit);
        registros = records as FusionadosSchema[];
      }

      console.log(`📊 Fusionados obtenidos: ${registros.length} registros`);
      return registros;
    } catch (error) {
      console.error(`❌ Error al obtener datos fusionados:`, error);
      throw new Error(`Error al obtener datos fusionados: ${error}`);
    }
  }

  async createFusionados(
    personas: any[], 
    planetas: any[], 
    peliculas: any[], 
    usuario: string
  ): Promise<FusionadosSchema> {
    try {
      const id = `fusionados-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fusionadosRecord = SchemaFactory.createFusionados(
        id,
        personas,
        planetas,
        peliculas,
        usuario
      );

      await this.databaseService.put(fusionadosRecord);
      
      console.log(`✅ Fusionados creados exitosamente: ${id}`);
      return fusionadosRecord;
    } catch (error) {
      console.error(`❌ Error al crear fusionados:`, error);
      throw new Error(`Error al crear datos fusionados: ${error}`);
    }
  }

  async getFusionadosById(id: string): Promise<FusionadosSchema | null> {
    try {
      const record = await this.databaseService.get(id);
      
      if (!record || record.categoria !== 'fusionados') {
        return null;
      }

      console.log(`📖 Fusionados obtenidos por ID: ${id}`);
      return record as FusionadosSchema;
    } catch (error) {
      console.error(`❌ Error al obtener fusionados por ID:`, error);
      throw new Error(`Error al obtener datos fusionados: ${error}`);
    }
  }

  async updateFusionados(id: string, updates: Partial<FusionadosSchema>): Promise<FusionadosSchema> {
    try {
      // Asegurar que no se cambie la categoría
      const safeUpdates = { ...updates };
      delete safeUpdates.categoria;

      const updatedRecord = await this.databaseService.update(id, safeUpdates);
      
      console.log(`🔄 Fusionados actualizados: ${id}`);
      return updatedRecord as FusionadosSchema;
    } catch (error) {
      console.error(`❌ Error al actualizar fusionados:`, error);
      throw new Error(`Error al actualizar datos fusionados: ${error}`);
    }
  }

  async deleteFusionados(id: string): Promise<boolean> {
    try {
      const success = await this.databaseService.delete(id);
      
      if (success) {
        console.log(`🗑️ Fusionados eliminados: ${id}`);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Error al eliminar fusionados:`, error);
      throw new Error(`Error al eliminar datos fusionados: ${error}`);
    }
  }
}

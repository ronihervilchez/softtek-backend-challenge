import { HistorialRepository, HistorialRepositoryImpl } from '../repositories/historial.repository';
import { HistorialResult } from '../../../interfaces';

export interface HistorialService {
  getHistorial(filters?: Record<string, any>): Promise<HistorialResult[]>;
}

export class HistorialServiceImpl implements HistorialService {
  private readonly historialRepository: HistorialRepository;

  constructor(historialRepository?: HistorialRepository) {
    this.historialRepository = historialRepository || new HistorialRepositoryImpl();
  }

  async getHistorial(filters?: Record<string, any>): Promise<HistorialResult[]> {
    try {
      // Lógica de negocio aquí
      const data = await this.historialRepository.getHistorial(filters);
      
      // Procesar o transformar los datos si es necesario
      return [...data].sort((a: HistorialResult, b: HistorialResult) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ); // Ordenar por fecha desc
    } catch (error) {
      throw new Error(`Error en el servicio de historial: ${error}`);
    }
  }
}

export interface AlmacenarResult {
  id: string;
  nombre: string;
  descripcion: string;
  datos?: Record<string, any>;
  tags?: string[];
  categoria: string;
  usuario?: string;
  procesado: boolean;
  fechaProcesamiento: string;
  fechaCreacion: string;
  timestamp?: number;
}

export interface FusionadosResult {
  id: string;
  data: any;
  procesado: boolean;
  timestamp: string;
}

export interface HistorialResult {
  id: number;
  accion: string;
  usuario: string;
  fecha: string;
  fechaFormateada: string;
  detalles: Record<string, any>;
  procesado: boolean;
}

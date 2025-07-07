import { IPerson } from "./fusionado.interface";

export interface AlmacenarResult {
  id: string;
  mensaje?: string;
  nombre?: string;
  descripcion?: string;
  datos?: Record<string, any>;
  tags?: string[];
  categoria?: string;
  usuario?: string;
  procesado?: boolean;
  fechaProcesamiento?: string;
  fechaCreacion?: string;
  timestamp?: number;
  externalDataCount?: number;
}

export interface FusionadosResult {
  id: string;
  data: any;
  procesado: boolean;
  timestamp: string;
}

export interface IHistoryList {
  histories: IHistory[];
  hasNextPage: boolean;
}

export interface IHistory {
  id?: string | number;
  fechaCreacion?: string;
  personas: IPerson[];
}

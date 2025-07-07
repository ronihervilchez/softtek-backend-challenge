import { DatabaseRecord } from "../interfaces/database.interface";
import { IPerson } from "../../../interfaces/fusionado.interface";

/**
 * Esquema para datos fusionados
 */
export interface FusionadosSchema {
  id: string; // UUID
  fechaCreacion: string; // ISO string
  people: IPerson[]; // Arreglo de personas fusionadas
  ttl: number; // TTL en segundos Unix timestamp (30 minutos)
}

/**
 * Esquema para datos almacenados del usuario
 */
export interface AlmacenadosSchema {
  usuario: string; // ID
  fechaCreacion: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono: string;
}

/**
 * Esquema para historial
 */
export interface HistorialSchema extends DatabaseRecord {
  categoria: "historial";
  datos: {
    accion: string;
    descripcion: string;
    parametros: Record<string, any>;
    resultado: "exitoso" | "fallido" | "pendiente";
    duracion?: number;
    error?: string;
  };
}

/**
 * Esquema para cache de APIs externas
 */
export interface CacheSchema {
  cacheKey: string;
  data: string; // JSON stringified
  ttl: number;
  createdAt: number;
  endpoint?: string;
  parameters?: Record<string, any>;
}

/**
 * Validadores de esquemas
 */
export class SchemaValidators {
  static validateFusionados(data: any): data is FusionadosSchema {
    return (
      data &&
      typeof data.id === "string" &&
      typeof data.fechaCreacion === "string" &&
      Array.isArray(data.people) &&
      typeof data.ttl === "number"
    );
  }

  static validateAlmacenados(data: any): data is AlmacenadosSchema {
    return (
      data &&
      typeof data.id === "string" &&
      typeof data.fechaCreacion === "string" &&
      typeof data.nombres === "string" &&
      typeof data.apellidos === "string" &&
      typeof data.fechaNacimiento === "string" &&
      typeof data.telefono === "string" &&
      typeof data.usuario === "string"
    );
  }

  static validateHistorial(data: any): data is HistorialSchema {
    return (
      data &&
      data.categoria === "historial" &&
      data.datos &&
      typeof data.datos.accion === "string" &&
      typeof data.datos.descripcion === "string" &&
      typeof data.datos.parametros === "object" &&
      ["exitoso", "fallido", "pendiente"].includes(data.datos.resultado)
    );
  }

  static validateCache(data: any): data is CacheSchema {
    return (
      data &&
      typeof data.cacheKey === "string" &&
      typeof data.data === "string" &&
      typeof data.ttl === "number" &&
      typeof data.createdAt === "number"
    );
  }
}

/**
 * Factory para crear registros con esquemas específicos
 */
export class SchemaFactory {
  static createFusionados(id: string, people: IPerson[]): FusionadosSchema {
    const ttlSeconds = 30 * 60; // 30 minutos
    return {
      id,
      fechaCreacion: new Date().toISOString(),
      people,
      ttl: Math.floor(Date.now() / 1000) + ttlSeconds,
    };
  }

  static createAlmacenados(
    nombres: string,
    apellidos: string,
    fechaNacimiento: string,
    telefono: string,
    usuario: string
  ): AlmacenadosSchema {
    return {
      usuario,
      fechaCreacion: new Date().toISOString(),
      nombres,
      apellidos,
      fechaNacimiento,
      telefono,
    };
  }

  static createHistorial(
    id: string,
    accion: string,
    descripcion: string,
    parametros: Record<string, any>,
    resultado: "exitoso" | "fallido" | "pendiente",
    usuario: string,
    options?: { duracion?: number; error?: string }
  ): HistorialSchema {
    return {
      id,
      categoria: "historial",
      fechaCreacion: new Date().toISOString(),
      nombre: `${accion} - ${new Date().toLocaleDateString()}`,
      datos: {
        accion,
        descripcion,
        parametros,
        resultado,
        duracion: options?.duracion,
        error: options?.error,
      },
      usuario,
      procesado: true,
      timestamp: Date.now(),
    };
  }

  static createCache(
    cacheKey: string,
    data: any,
    ttlSeconds: number,
    endpoint?: string,
    parameters?: Record<string, any>
  ): CacheSchema {
    return {
      cacheKey,
      data: JSON.stringify(data),
      ttl: Math.floor(Date.now() / 1000) + ttlSeconds,
      createdAt: Math.floor(Date.now() / 1000),
      endpoint,
      parameters,
    };
  }
}

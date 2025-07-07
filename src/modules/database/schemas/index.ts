import { IPerson } from "../../../interfaces/fusionado.interface";

/**
 * Esquema para datos fusionados
 */
export interface FusionadosSchema {
  id: string; // UUID
  fechaCreacion: string; // ISO string
  personas: IPerson[]; // Arreglo de personas fusionadas
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
export interface HistorialSchema {
  id: string; // UUID
  fechaCreacion: string; // ISO string
  personas: IPerson[]; // Arreglo de personas del historial
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
      Array.isArray(data.personas) &&
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
      typeof data.id === "string" &&
      typeof data.fechaCreacion === "string" &&
      Array.isArray(data.personas)
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
      personas: people,
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
    personas: IPerson[]
  ): HistorialSchema {
    return {
      id,
      fechaCreacion: new Date().toISOString(),
      personas,
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

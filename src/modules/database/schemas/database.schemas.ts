import { IPerson } from "../../../interfaces/fusionado.interface";

/**
 * Esquema para cache de datos fusionados
 */
export interface CacheSchema {
  id: string;
  fechaCreacion: string;
  personas: IPerson[];
  ttl: number;
}

/**
 * Esquema para datos almacenados del usuario
 */
export interface UsuariosSchema {
  usuario: string;
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
  id: string;
  fechaCreacion: string;
  personas: IPerson[];
}

/**
 * Validadores de esquemas
 */
export class SchemaValidators {
  static validateCache(data: any): data is CacheSchema {
    return (
      data &&
      typeof data.id === "string" &&
      typeof data.fechaCreacion === "string" &&
      Array.isArray(data.personas) &&
      typeof data.ttl === "number"
    );
  }

  static validateUsuarios(data: any): data is UsuariosSchema {
    return (
      data &&
      typeof data.usuario === "string" &&
      typeof data.fechaCreacion === "string" &&
      typeof data.nombres === "string" &&
      typeof data.apellidos === "string" &&
      typeof data.fechaNacimiento === "string" &&
      typeof data.telefono === "string"
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
}

/**
 * Factory para crear registros con esquemas específicos
 */
export class SchemaFactory {
  static createCache(id: string, people: IPerson[]): CacheSchema {
    const ttlSeconds = 30 * 60; // 30 minutos
    return {
      id,
      fechaCreacion: new Date().toISOString(),
      personas: people,
      ttl: Math.floor(Date.now() / 1000) + ttlSeconds,
    };
  }

  static createUsuarios(
    nombres: string,
    apellidos: string,
    fechaNacimiento: string,
    telefono: string,
    usuario: string
  ): UsuariosSchema {
    return {
      usuario,
      fechaCreacion: new Date().toISOString(),
      nombres,
      apellidos,
      fechaNacimiento,
      telefono,
    };
  }

  static createHistorial(id: string, personas: IPerson[]): HistorialSchema {
    return {
      id,
      fechaCreacion: new Date().toISOString(),
      personas,
    };
  }
}

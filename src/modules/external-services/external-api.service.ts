import { IFilm } from "./interfaces/film.interface";
import { IExternalPerson, IOtherExternalPersonData } from "./interfaces/people.interface";
import { Response } from "./interfaces/response.interface";

// Interfaz para los datos de la API de Star Wars adicional

export interface ExternalApiService {
  getPeopleList(headers?: Record<string, string>): Promise<IExternalPerson[]>;
  getFilms(headers?: Record<string, string>): Promise<IFilm[]>;
  getOtherPeopleData(headers?: Record<string, string>): Promise<IOtherExternalPersonData[]>;
}

export class ExternalApiServiceImpl implements ExternalApiService {
  private readonly defaultHeaders: Record<string, string>;

  constructor() {
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async getPeopleList(headers?: Record<string, string>): Promise<IExternalPerson[]> {
    try {
      console.log("🌐 Consultando API externa: https://swapi.info/api/people");

      const response = await fetch("https://swapi.info/api/people", {
        method: "GET",
        headers: { ...this.defaultHeaders, ...headers },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as Response<IExternalPerson>;

      // Validación defensiva
      if (!Array.isArray(data)) {
        console.warn("⚠️ API de personas retornó estructura inválida, usando array vacío");
        return [];
      }

      console.log(`✅ API externa respondió: ${data.length} personas obtenidas`);
      return data;
    } catch (error) {
      console.error("❌ Error al consultar API externa de personas:", error);
      // Retornar array vacío en lugar de fallar
      console.warn("⚠️ Retornando array vacío para personas debido al error");
      return [];
    }
  }

  async getFilms(headers?: Record<string, string>): Promise<IFilm[]> {
    try {
      console.log("🌐 Consultando API externa: https://swapi.info/api/films");

      const response = await fetch("https://swapi.info/api/films", {
        method: "GET",
        headers: { ...this.defaultHeaders, ...headers },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as IFilm[];

      // Validación defensiva
      if (!Array.isArray(data)) {
        console.warn("⚠️ API de películas retornó estructura inválida, usando array vacío");
        return [];
      }

      console.log(`✅ API externa respondió: ${data.length} películas obtenidas`);
      return data;
    } catch (error) {
      console.error("❌ Error al consultar API externa de películas:", error);
      // Retornar array vacío en lugar de fallar
      console.warn("⚠️ Retornando array vacío para películas debido al error");
      return [];
    }
  }

  async getOtherPeopleData(headers?: Record<string, string>): Promise<IOtherExternalPersonData[]> {
    try {
      console.log("🌐 Consultando API externa: https://akabab.github.io/starwars-api/api/all.json");

      const response = await fetch("https://akabab.github.io/starwars-api/api/all.json", {
        method: "GET",
        headers: { ...this.defaultHeaders, ...headers },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as IOtherExternalPersonData[];

      // Validación defensiva
      if (!Array.isArray(data)) {
        console.warn("⚠️ API de otros datos retornó estructura inválida, usando array vacío");
        return [];
      }

      console.log(`✅ API externa respondió: ${data.length} registros de personas obtenidos`);
      return data;
    } catch (error) {
      console.error("❌ Error al consultar API externa de otros datos de personas:", error);
      // Retornar array vacío en lugar de fallar
      console.warn("⚠️ Retornando array vacío para otros datos debido al error");
      return [];
    }
  }
}

// Instancia singleton del servicio
export const externalApiService = new ExternalApiServiceImpl();

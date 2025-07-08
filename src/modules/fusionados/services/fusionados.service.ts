import { v4 as uuidv4 } from "uuid";
import { IPerson } from "../../../interfaces/fusionado.interface";
import { getCacheService } from "../../database/services/cache.service";
import { getHistorialService } from "../../historial/services/historial.service";
import { externalApiService } from "../../external-services/external-api.service";
import { IOtherExternalPersonData } from "../../external-services/interfaces/people.interface";

export interface FusionadosService {
  getFusionados(filters?: Record<string, any>): Promise<IPerson[]>;
}

export class FusionadosServiceImpl implements FusionadosService {
  private readonly cacheService = getCacheService();
  private readonly historialService = getHistorialService();

  async getFusionados(filters?: Record<string, any>): Promise<IPerson[]> {
    try {
      console.log("🔄 Obteniendo datos fusionados...");

      // Verificar si los datos están en cache
      const cachedData = await this.cacheService.findFusionados();
      if (cachedData) {
        console.log(
          `📋 Datos obtenidos desde cache (ID: ${cachedData.id}, creado: ${cachedData.fechaCreacion})`
        );
        return this.applyFilters(cachedData.personas, filters);
      }

      console.log("🌐 Cache miss - obteniendo datos desde APIs externas...");

      // Obtener datos de las 3 APIs externas en paralelo
      const [peopleList, films, otherPeopleData] = await Promise.all([
        externalApiService.getPeopleList(),
        externalApiService.getFilms(),
        externalApiService.getOtherPeopleData(),
      ]);

      console.log(
        `📊 Datos externos obtenidos - Personas SWAPI: ${peopleList.length}, Películas: ${films.length}, Otros datos: ${otherPeopleData.length}`
      );

      // Crear Maps para búsquedas optimizadas O(1) en lugar de O(n)
      console.log("🗺️ Creando Maps para optimización de búsquedas...");

      const otherPeopleMap = new Map<string, IOtherExternalPersonData>();
      otherPeopleData.forEach(person => {
        const key = person.name?.toLowerCase().trim();
        if (key) {
          otherPeopleMap.set(key, person);
        }
      });

      const filmsMap = new Map<string, string>();
      films.forEach(film => {
        if (film.url && film.title) {
          filmsMap.set(film.url, film.title);
        }
      });

      // Fusionar los datos para crear el arreglo de IPerson
      const fusionedData: IPerson[] = peopleList.map((person) => {
        // Buscar datos adicionales usando el Map (O(1))
        const personKey = person.name?.toLowerCase().trim();
        const otherData = otherPeopleMap.get(personKey);

        // Obtener las películas en las que aparece usando el Map (O(1))
        const personFilms: string[] = person.films
          .map(filmUrl => filmsMap.get(filmUrl))
          .filter((title): title is string => title !== undefined);

        // Crear el objeto IPerson fusionado
        let masters: string[] = [];
        if (Array.isArray(otherData?.masters)) {
          masters = otherData.masters;
        } else if (otherData?.masters) {
          masters = [otherData.masters];
        }

        let apprentices: string[] = [];
        if (Array.isArray(otherData?.apprentices)) {
          apprentices = otherData.apprentices;
        } else if (otherData?.apprentices) {
          apprentices = [otherData.apprentices];
        }

        const fusionedPerson: IPerson = {
          id: otherData?.id,
          nombre: person.name,
          altura: parseInt(person.height) || 0,
          peso: parseInt(person.mass) || 0,
          genero: person.gender,
          especie:
            Array.isArray(person.species) && person.species.length > 0
              ? person.species[0]
              : otherData?.species ?? "Desconocida",
          died: otherData?.died,
          planeta: Array.isArray(otherData?.homeworld)
            ? otherData.homeworld[0]
            : otherData?.homeworld ?? "Desconocido",
          peliculas: personFilms,
          maestros: masters,
          aprendices: apprentices,
          imagen: otherData?.image ?? "",
        };

        return fusionedPerson;
      });

      // Generar ID único para cache e historial
      const uniqueId = uuidv4();

      // Guardar en cache (datos temporales con TTL)
      await this.cacheService.saveFusionados(uniqueId, fusionedData);

      // Guardar en historial (datos persistentes) - solo cuando se obtienen de APIs externas
      await this.historialService.saveHistorial(uniqueId, fusionedData);

      console.log(`✅ Datos fusionados procesados: ${fusionedData.length} personas`);
      console.log(`💾 Guardado en cache y historial con ID: ${uniqueId}`);

      return this.applyFilters(fusionedData, filters);
    } catch (error) {
      console.error(`❌ Error en el servicio de fusionados:`, error);
      throw new Error(`Error en el servicio de fusionados: ${error}`);
    }
  }

  private applyFilters(data: IPerson[], filters?: Record<string, any>): IPerson[] {
    let filteredData = data;

    if (filters?.limit) {
      filteredData = data.slice(0, parseInt(filters.limit));
    }

    if (filters?.genero) {
      filteredData = filteredData.filter((person) =>
        person.genero.toLowerCase().includes(filters.genero.toLowerCase())
      );
    }

    if (filters?.especie) {
      filteredData = filteredData.filter((person) =>
        person.especie.toLowerCase().includes(filters.especie.toLowerCase())
      );
    }

    return filteredData;
  }
}

// Exportar instancia singleton
export const fusionadosService = new FusionadosServiceImpl();

import { v4 as uuidv4 } from "uuid";
import { IPerson } from "../../../interfaces/fusionado.interface";
import { getCacheService } from "../../database/services/cache.service";
import { externalApiService } from "../../external-services/external-api.service";

export interface FusionadosService {
  getFusionados(filters?: Record<string, any>): Promise<IPerson[]>;
}

export class FusionadosServiceImpl implements FusionadosService {
  private readonly cacheService = getCacheService();

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

      // Fusionar los datos para crear el arreglo de IPerson
      const fusionedData: IPerson[] = peopleList.map((person) => {
        // Buscar datos adicionales en otherPeopleData por nombre
        const otherData = otherPeopleData.find(
          (other) => other.name.toLowerCase() === person.name.toLowerCase()
        );

        // Obtener las películas en las que aparece
        const personFilms = films.filter((film) => person.films.includes(film.url)).map((film) => film.title);

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

      // Guardar en cache con un ID único
      await this.cacheService.saveFusionados(uuidv4(), fusionedData);

      console.log(`✅ Datos fusionados procesados: ${fusionedData.length} personas`);

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

import { AlmacenarDto } from '../dtos/almacenar.dto';
import { UsuariosSchema } from '../../database/schemas/database.schemas';
import { getAlmacenarService } from '../services/almacenar.service';

export interface AlmacenarRepository {
  almacenar(data: AlmacenarDto): Promise<UsuariosSchema>;
}

export class AlmacenarRepositoryImpl implements AlmacenarRepository {
  private readonly almacenarService = getAlmacenarService();

  async almacenar(data: AlmacenarDto): Promise<UsuariosSchema> {
    try {
      console.log('📝 Repositorio - almacenando usuario...');
      
      // Crear el schema de usuario
      const usuarioData: UsuariosSchema = {
        usuario: data.usuario,
        fechaCreacion: new Date().toISOString(),
        nombres: data.nombres,
        apellidos: data.apellidos,
        fechaNacimiento: data.fechaNacimiento,
        telefono: data.telefono,
      };

      // Guardar en la tabla de usuarios usando el servicio consolidado
      const success = await this.almacenarService.saveUsuario(usuarioData);

      if (success) {
        console.log(`✅ Repositorio - Usuario almacenado: ${data.usuario}`);
        return usuarioData;
      } else {
        throw new Error('No se pudo guardar el usuario en la base de datos');
      }
    } catch (error) {
      console.error(`❌ Error en repositorio almacenar:`, error);
      throw new Error(`Error al almacenar usuario: ${error}`);
    }
  }
}

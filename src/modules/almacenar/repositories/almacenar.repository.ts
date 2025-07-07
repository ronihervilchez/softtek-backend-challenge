import { AlmacenarDto } from '../dtos/almacenar.dto';
import { UsuariosSchema } from '../../database/schemas';
import { getUsuariosService } from '../services/usuarios.service';

export interface AlmacenarRepository {
  almacenar(data: AlmacenarDto): Promise<UsuariosSchema>;
}

export class AlmacenarRepositoryImpl implements AlmacenarRepository {
  private readonly usuariosService = getUsuariosService();

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

      // Guardar en la tabla de usuarios usando el servicio
      const success = await this.usuariosService.saveUsuario(usuarioData);

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

import { AlmacenarDto } from '../dtos/almacenar.dto';
import { getUsuariosService } from './usuarios.service';
import { UsuariosSchema } from '../../database/schemas';

export interface AlmacenarService {
  almacenar(data: AlmacenarDto): Promise<UsuariosSchema>;
}

export class AlmacenarServiceImpl implements AlmacenarService {
  private readonly usuariosService = getUsuariosService();

  async almacenar(data: AlmacenarDto): Promise<UsuariosSchema> {
    try {
      console.log('👤 Almacenando datos de usuario...');
      
      // Crear el schema de usuario
      const usuarioData: UsuariosSchema = {
        usuario: data.usuario,
        fechaCreacion: new Date().toISOString(),
        nombres: data.nombres,
        apellidos: data.apellidos,
        fechaNacimiento: data.fechaNacimiento,
        telefono: data.telefono,
      };

      // Guardar en la tabla de usuarios
      const success = await this.usuariosService.saveUsuario(usuarioData);

      if (success) {
        console.log(`✅ Usuario guardado exitosamente: ${data.usuario}`);
        return usuarioData;
      } else {
        console.log(`❌ Error guardando usuario: ${data.usuario}`);
        throw new Error('Error al almacenar usuario en la base de datos');
      }
    } catch (error) {
      console.error('❌ Error en el servicio de almacenar:', error);
      throw new Error(`Error al almacenar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}

// Exportar instancia singleton
export const almacenarService = new AlmacenarServiceImpl();

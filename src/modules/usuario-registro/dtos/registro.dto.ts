// src/modules/usuario-registro/dtos/registro.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegistroUsuarioDto {
  @IsEmail({}, { message: 'Email debe tener formato válido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email: string;

  @IsString({ message: 'Nombres debe ser una cadena' })
  @IsNotEmpty({ message: 'Nombres es requerido' })
  nombres: string;

  @IsString({ message: 'Apellidos debe ser una cadena' })
  @IsNotEmpty({ message: 'Apellidos es requerido' })
  apellidos: string;

  @IsString({ message: 'Fecha de nacimiento es requerida' })
  @IsNotEmpty({ message: 'Fecha de nacimiento es requerida' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha debe estar en formato YYYY-MM-DD' })
  fechaNacimiento: string;

  @IsString({ message: 'Teléfono debe ser una cadena' })
  @IsNotEmpty({ message: 'Teléfono es requerido' })
  telefono: string;

  @IsString({ message: 'Password debe ser una cadena' })
  @MinLength(6, { message: 'Password debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'Password es requerido' })
  password: string;
}
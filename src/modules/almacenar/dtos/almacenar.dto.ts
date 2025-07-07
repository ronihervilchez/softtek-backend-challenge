import { IsNotEmpty, IsString } from "class-validator";

export class AlmacenarDto {
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @IsString()
  @IsNotEmpty()
  nombres: string;

  @IsString()
  @IsNotEmpty()
  apellidos: string;

  @IsString()
  @IsNotEmpty()
  fechaNacimiento: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;
}

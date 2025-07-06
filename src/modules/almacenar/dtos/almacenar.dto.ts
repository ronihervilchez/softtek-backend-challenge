import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class AlmacenarDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsOptional()
  @IsObject()
  datos?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsOptional()
  @IsString()
  usuario?: string;
}

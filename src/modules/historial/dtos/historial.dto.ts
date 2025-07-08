import { IsInt, Min, Max, IsOptional, IsObject } from 'class-validator';

export class HistorialDto {
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(50, { message: 'El límite no puede ser mayor a 50' })
  limit: number;

  @IsOptional()
  @IsObject({ message: 'lastEvaluatedKey debe ser un objeto válido' })
  lastEvaluatedKey?: Record<string, any>;
}

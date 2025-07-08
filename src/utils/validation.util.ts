import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { ValidationResult } from '../interfaces/response.interface';

export class ValidationUtil {
  static async validateDto<T extends object>(
    DtoClass: new () => T,
    data: any
  ): Promise<ValidationResult<T>> {
    const dto = plainToClass(DtoClass, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = errors.map((error: any) => 
        Object.values(error.constraints ?? {}).join(", ")
      );
      return {
        isValid: false,
        errors: errorMessages,
      };
    }

    return {
      isValid: true,
      errors: [],
      dto,
    };
  }
}

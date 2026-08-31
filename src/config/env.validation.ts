import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsInt()
  @Min(0)
  PORT?: number;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  DIRECT_URL!: string;

  // Ambas opcionais: se as duas estiverem definidas, /docs e /docs-json
  // exigem HTTP Basic Auth. Se qualquer uma faltar, a documentação fica
  // aberta (comportamento atual, mantido como default).
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  SWAGGER_USER?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  SWAGGER_PASSWORD?: string;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Variáveis de ambiente inválidas: ${errors.toString()}`);
  }

  return validatedConfig;
}

import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  public DATABASE_HOST: string;
  @IsString()
  public DATABASE_USER: string;
  @IsString()
  public DATABASE_PASSWORD: string;
  @IsString()
  public DATABASE_NAME: string;
  @IsNumber()
  public DATABASE_PORT: number;
  @IsString()
  public NOTIFICATION_API: string;
  @IsString()
  public SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

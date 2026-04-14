import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigurationService {
  public constructor(private configService: ConfigService) {}

  public get DATABASE_HOST() {
    return this.configService.get<string>('DATABASE_HOST');
  }

  public get DATABASE_PORT() {
    return this.configService.get<number>('DATABASE_PORT');
  }

  public get DATABASE_USER() {
    return this.configService.get<string>('DATABASE_USER');
  }

  public get DATABASE_PASSWORD() {
    return this.configService.get<string>('DATABASE_PASSWORD');
  }
  public get DATABASE_NAME() {
    return this.configService.get<string>('DATABASE_NAME');
  }

  public get SECRET() {
    return this.configService.get<string>('SECRET');
  }

  public get NOTIFICATION_API() {
    return this.configService.get<string>('NOTIFICATION_API');
  }

  public get DOMAIN_HOST() {
    return this.configService.get<string>('DOMAIN_HOST');
  }
}

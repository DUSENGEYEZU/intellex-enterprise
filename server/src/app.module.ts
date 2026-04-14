import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationModule } from './configuration/configuration.module';
import { ConfigurationService } from './configuration/configuration.service';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { ServiceModule } from './service/service.module';
import { EndpointModule } from './endpoint/endpoint.module';
import { TrafficModule } from './traffic/traffic.module';
import { ConnectionModule } from './connection/connection.module';
import { EndpointParamsModule } from './endpoint-params/endpoint-params.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ApiTestBenchModule } from './api-test-bench/api-test-bench.module';



@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (configService: ConfigurationService) => ({
        type: 'postgres',
        host: configService.DATABASE_HOST,
        port: configService.DATABASE_PORT,
        username: configService.DATABASE_USER,
        password: configService.DATABASE_PASSWORD,
        database: configService.DATABASE_NAME,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // never set this flag to true in production
        logging: false,
        keepConnectionAlive: true,
        // migrations,
        migrationsTransactionMode: 'all',
        migrationsRun: true,
      }),
    }),
    UserModule,
    AuthenticationModule,
    WorkspaceModule,
    ServiceModule,
    EndpointModule,
    TrafficModule,
    ConnectionModule,
    EndpointParamsModule,
    SubscriptionModule,
    ApiTestBenchModule,

  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}

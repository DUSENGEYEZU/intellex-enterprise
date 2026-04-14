import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import { ValidationPipe } from '@nestjs/common';
import { SeederService } from './utils/seeder/seeder.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   app.useGlobalPipes(new ValidationPipe());

  // Load Swagger only in development mode
  if(process.env.NODE_ENV !== 'production'){
    const config = new DocumentBuilder()
    .setTitle('Intellex - Data Exchange Middleware')
    .setDescription('API Specification')
    .setVersion('1.0')
    .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  app.enableCors();

  await app.listen(process.env.SERVER_PORT, '0.0.0.0');
  const dataSource = app.get(DataSource);
  runSeeders(dataSource, {
    seeds: [__dirname + '/**/*.seed{.ts,.js}'],
  });

  const seeder = app.get(SeederService);
  await seeder.seed();
}
bootstrap();

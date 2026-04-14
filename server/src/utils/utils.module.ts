import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsService } from './services/utils.service';
import { ConfigurationModule } from '../configuration/configuration.module';
import { UtilsController } from './controllers/utils.controller';
import { IndustryEntity } from './entities/industry.entity';
import { RegionEntity } from './entities/region.entity';
import { CountryEntity } from './entities/country.entity';
import { OtpService } from './services/otp/otp.service';
import { SeederService } from './seeder/seeder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([IndustryEntity, RegionEntity, CountryEntity]),
    HttpModule, ConfigurationModule, TypeOrmModule.forFeature([])],
  providers: [UtilsService, OtpService, SeederService],
  exports: [UtilsService, OtpService, SeederService],
  controllers: [UtilsController],
})
export class UtilsModule {}

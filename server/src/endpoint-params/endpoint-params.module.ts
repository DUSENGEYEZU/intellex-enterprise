import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from 'src/utils/utils.module';
import { EndpointParamsService } from './endpoint-params.service';
import { EndpointParamsEntity } from './endpoint-params.entity';
import { EndpointParamsController } from './endpoint-params.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([EndpointParamsEntity]), //Needed to provide ConnectionEntity repo into the traffic context
        UtilsModule
      ],
      controllers: [EndpointParamsController],
      providers: [EndpointParamsService]
})
export class EndpointParamsModule {}

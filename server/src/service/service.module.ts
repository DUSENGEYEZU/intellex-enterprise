
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from 'src/utils/utils.module';
import { ServiceController } from './controllers/service/service.controller';
import { ServiceService } from './services/service/service.service';
import { ServiceEntity } from './entities/service.entity';
import { AuthenticationService } from 'src/authentication/services/authentication.service';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/user/entities/user.entity';
import { UserWorkspaceEntity } from 'src/workspace/entities/user_workspace.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ServiceEntity, UserEntity, UserWorkspaceEntity]), UtilsModule],
    controllers: [ServiceController],
    providers: [ServiceService, AuthenticationService, JwtService],
    exports: [ServiceService],
  })
  export class ServiceModule {}

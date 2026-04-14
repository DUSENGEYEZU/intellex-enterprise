import { Module } from '@nestjs/common';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionEntity } from './connection.entity';
import { UtilsModule } from 'src/utils/utils.module';
import { WorkspaceService } from 'src/workspace/services/workspace/workspace.service';
import { WorkspaceEntity } from 'src/workspace/entities/workspace.entity';
import { UserWorkspaceEntity } from 'src/workspace/entities/user_workspace.entity';
import { EndpointEntity } from 'src/endpoint/entities/endpoint.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { AuthenticationService } from 'src/authentication/services/authentication.service';
import { EndpointGroupEntity } from 'src/endpoint/entities/endpoint-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConnectionEntity, WorkspaceEntity, UserWorkspaceEntity, EndpointEntity, UserEntity, EndpointGroupEntity]), UtilsModule],
  controllers: [ConnectionController],
  providers: [ConnectionService, WorkspaceService, JwtService, AuthenticationService]
})
export class ConnectionModule {}

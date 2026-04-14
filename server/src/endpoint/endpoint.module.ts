import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from 'src/utils/utils.module';
import { EndpointController } from './controllers/endpoint/endpoint.controller';
import { EndpointService } from './services/endpoint/endpoint.service';
import { EndpointEntity } from './entities/endpoint.entity';
import { EndpointParamsService } from 'src/endpoint-params/endpoint-params.service';
import { EndpointParamsModule } from 'src/endpoint-params/endpoint-params.module';
import { EndpointParamsEntity } from 'src/endpoint-params/endpoint-params.entity';
import { AuthenticationService } from 'src/authentication/services/authentication.service';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/user/entities/user.entity';
import { UserWorkspaceEntity } from 'src/workspace/entities/user_workspace.entity';
import { EndpointGroupEntity } from './entities/endpoint-group.entity';
import { EndpointGroupMemberEntity } from './entities/endpoint-group-member.entity';
import { ConnectionService } from 'src/connection/connection.service';
import { ConnectionEntity } from 'src/connection/connection.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([EndpointEntity, EndpointParamsEntity, UserEntity, UserWorkspaceEntity, EndpointGroupEntity, EndpointGroupMemberEntity, ConnectionEntity]), 
        UtilsModule,
        EndpointParamsModule
    ],
    controllers: [EndpointController],
    providers: [EndpointService, EndpointParamsService, AuthenticationService, JwtService, ConnectionService],
    exports: [EndpointService],
})
export class EndpointModule {}
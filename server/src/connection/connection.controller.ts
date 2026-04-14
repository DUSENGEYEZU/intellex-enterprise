import { Body, Controller, Get, Param, Post, Put, Req, UnauthorizedException } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { CreateConnectionDto } from './connection.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from 'src/workspace/services/workspace/workspace.service';
import { Request } from 'express';
import { AuthenticationService } from 'src/authentication/services/authentication.service';
import { Public } from 'src/authentication/guards/metadata/metadata';

@ApiTags('Connections')
@Controller('connection')
export class ConnectionController {
    constructor(
        private connectionService: ConnectionService,
        private workspaceService: WorkspaceService,
        private authService: AuthenticationService
    ){}
    
    @Public()
    @ApiOperation({summary:"Request a new connection"})
    @Post('request')
    async createConnection(
        @Body() body: CreateConnectionDto,
        @Req() request: Request ){
        // Verify if requesting user (from token) has access to this workspace
        if(await this.authService.userHasAccess(request.headers['authorization'], body.consumer_workspace_id) === false){
            throw new UnauthorizedException('Unauthorized access to this workspace');
        }
        if(!body.purpose){
            return {status: false, message:"Please specify the purpose for which you will use this API"}
        }
        if(body.endpoint_id && body.endpoint_group_id){
            return {status: false, message:"Please specify either an endpoint_id or an endpoint_group_id, not both"}
        }
        return await this.connectionService.createConnection(
            body.service_id,
            body.endpoint_id,
            body.endpoint_group_id,
            body.consumer_workspace_id,
            body.producer_workspace_id,
            body.created_by,
            body.purpose
        );
    }

    @ApiOperation({summary:"Grant connection request"})
    @Put('grant/:connection_id/user/:granted_by')
    async grantConnection(
        @Param('connection_id') connection_id: string, 
        @Param('granted_by') granted_by: string){
            // Check if the granting user has access to the producer workspace
            const connection = await this.connectionService.getConnectionById(connection_id);
            if(connection){
                const verifiedAccess = await this.workspaceService.verifyIfUserBelongsToWorspace(granted_by, connection.producer_workspace_id)
                if(verifiedAccess.status == true){
                    return await this.connectionService.grantConnection(connection_id, granted_by);
                }else{
                    return verifiedAccess; 
                }
            }else{
                return {status: false, message: "This connection does not exist"}
            }
    }

    @Public()
    @ApiOperation({summary:"Cancel connection"})
    @Put('cancel/:connection_id/user/:denied_by')
    async cancelConnection(
        @Param('connection_id') connection_id: string,
        @Param('denied_by') denied_by: string
        ){
        // Check if the granting user has access to the producer workspace
        const connection = await this.connectionService.getConnectionById(connection_id);
        if(connection){
            const verifiedAccess = await this.workspaceService.verifyIfUserBelongsToWorspace(denied_by, connection.producer_workspace_id)
            if(verifiedAccess.status == true){
                return await this.connectionService.cancelConnection(connection_id);
            }else{
                return verifiedAccess; 
            }
        }else{
            return {status: false, message: "This connection does not exist"}
        }
    }

    @ApiOperation({summary:"Show connections that the current consumer has requested"})
    @Get('workspace/consumer/:consumer_workspace_id')
    async getConsumerWorkspaceConnections(
        @Param('consumer_workspace_id') consumer_workspace_id: string,
        @Req() request: Request
    ){
        // Verify if requesting user (from token) has access to this workspace
        if(await this.authService.userHasAccess(request.headers['authorization'], consumer_workspace_id) === false){
            throw new UnauthorizedException('Unauthorized access to this workspace');
        }
        return await this.connectionService.getConsumerWorkspaceConnections(consumer_workspace_id);
    }

    @ApiOperation({summary:"Show connections that the current consumer has requested on groups"})
    @Get('workspace/consumer/:consumer_workspace_id/groups')
    async getConsumerWorkspaceConnectionsOnGroups(
        @Param('consumer_workspace_id') consumer_workspace_id: string,
        @Req() request: Request
    ){
        // Verify if requesting user (from token) has access to this workspace
        if(await this.authService.userHasAccess(request.headers['authorization'], consumer_workspace_id) === false){
            throw new UnauthorizedException('Unauthorized access to this workspace');
        }
        return await this.connectionService.getConsumerWorkspaceConnectionsOnGroups(consumer_workspace_id);
    }

    @ApiOperation({summary:"Show connections that the current producer has granted or still pending"})
    @Get('workspace/producer/:producer_workspace_id')
    async getProducerWorkspaceConnections(
        @Param('producer_workspace_id') producer_workspace_id: string,
        @Req() request: Request ){
            // Verify if requesting user (from token) has access to this workspace
            if(await this.authService.userHasAccess(request.headers['authorization'], producer_workspace_id) === false){
                // return {status: false, message:"Unauthorized", data:[]}
                throw new UnauthorizedException('Unauthorized access to this workspace');
            }
        return await this.connectionService.getProducerWorkspaceConnections(producer_workspace_id);
    }

    @ApiOperation({summary:"Show group connections for producer_id"})
    @Get('workspace/producer/:producer_workspace_id/groups')
    async getProducerConnectionsOnGroups(
        @Param('producer_workspace_id') producer_workspace_id: string,
        @Req() request: Request ){
            // Verify if requesting user (from token) has access to this workspace
            if(await this.authService.userHasAccess(request.headers['authorization'], producer_workspace_id) === false){
                // return {status: false, message:"Unauthorized", data:[]}
                throw new UnauthorizedException('Unauthorized access to this workspace');
            }
        return await this.connectionService.getProducerConnectionsOnGroups(producer_workspace_id);
    }

    @ApiOperation({summary:"Get connections linked to a service"})
    @Get('service/:service_id')
    async getServiceConnections(
        @Param('service_id') service_id: string
        ){
        return await this.connectionService.getServiceConnections(service_id);
    }

    @Public()
    @ApiOperation({summary:"Count the number of connections linked to the given endpoint"})
    @Get('endpoint/:endpoint_id/count')
    async countConnectionsByEndpoint(@Param('endpoint_id') endpoint_id: string){
        return await this.connectionService.countConnectionsByEndpoint(endpoint_id);
    }

    @Public()
    @ApiOperation({summary:"Count the number of connections linked to the given API group"})
    @Get('group/:group_id/count')
    async countConnectionsByGroup(@Param('group_id') group_id: string){
        return await this.connectionService.countConnectionsByGroup(group_id);
    }

    @ApiOperation({summary:"Get connection status of an endpoint by a given workspace"})
    @Get('endpoint/:endpoint_id/workspace/:workspace_id')
    async getEndpointWorkspaceConnection(
        @Param('endpoint_id') endpoint_id: string,
        @Param('workspace_id') workspace_id: string
    ){
        return await this.connectionService.getEndpointWorkspaceConnection(endpoint_id, workspace_id);
    }

    @ApiOperation({summary:"Get connection status of an API group by a given workspace"})
    @Get('group/:group_id/workspace/:workspace_id')
    async getGroupWorkspaceConnection(
        @Param('group_id') group_id: string,
        @Param('workspace_id') workspace_id: string
    ){
        return await this.connectionService.getGroupWorkspaceConnection(group_id, workspace_id);
    }
}
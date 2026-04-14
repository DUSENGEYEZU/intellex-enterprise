import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticationService } from 'src/authentication/services/authentication.service';
import { CreateServiceDto, UpdateServiceDto } from 'src/service/dtos/service.dto';
import { ServiceService } from 'src/service/services/service/service.service';

@ApiTags("Services")
@Controller('service')
export class ServiceController {
    constructor(
        private service: ServiceService,
        private authService: AuthenticationService
    ){}

    @ApiOperation({summary: "Create a new service"})
    @Post('create')
    async createService(
        @Body() body: CreateServiceDto,
        @Req() request: Request ){
        // Verify if requesting user (from token) has access to this workspace
        if(await this.authService.userHasAccess(request.headers['authorization'], body.workspace_id) === false){
            // return {status: false, message:"Unauthorized", data:[]}
            throw new UnauthorizedException('Unauthorized access to this workspace');
        }
        return await this.service.createService(body.service_name, body.description, body.workspace_id, body.created_by);
    }

    @ApiOperation({summary: "Update service details"})
    @Patch('patch')
    async updateService(
        @Body() body: UpdateServiceDto){
        return await this.service.updateService(body.service_id, body.service_name, body.description);
    }

    @ApiOperation({summary: "Get all services under a workspace"})
    @Get('workspace/:workspace_id')
    async getWorkspaceServices(
        @Param('workspace_id') workspace_id: string,
        @Req() request: Request 
    ){
        // Verify if requesting user (from token) has access to this workspace
        if(await this.authService.userHasAccess(request.headers['authorization'], workspace_id) === false){
            // return {status: false, message:"Unauthorized", data:[]}
            throw new UnauthorizedException('Unauthorized access to this workspace');
        }
        return await this.service.getWorkspaceServices(workspace_id);
    }

    @ApiOperation({summary: "Get public worspace services. This is called by external workspace to see services publiched by other workspaces"})
    @Get('workspace/:workspace_id/public')
    async getPublicWorkspaceServices(@Param('workspace_id') workspace_id: string){
        return await this.service.getPublicWorkspaceServices(workspace_id);
    }

    @ApiOperation({summary: "Delete a service. Only authorized users can delete the service"})
    @Delete('delete/:service_id')
    async deleteService(@Param('service_id') service_id: string){
        return await this.service.deleteService(service_id);
    }

    @ApiOperation({summary: "Publish/Unpublish a service. Set `is_public` to `true` to publish the service, and `false` to unpublish."})
    @Get(':service_id/publish/:is_public')
    async changeServicePublicStatus(
        @Param('service_id') service_id: string, 
        @Param('is_public') is_public: boolean){
        return await this.service.changeServicePublicStatus(service_id, is_public)
    }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/authentication/guards/metadata/metadata';
import { AuthenticationService } from 'src/authentication/services/authentication.service';
import { ConnectionService } from 'src/connection/connection.service';
import { EndpointParamsService } from 'src/endpoint-params/endpoint-params.service';
import { AddEndpointToGroupDto, EndpointGroupDto } from 'src/endpoint/dtos/endpoint-group.dto';
import { UpdateEndpointDto, createEndpointDto } from 'src/endpoint/dtos/endpoint.dto';
import { EndpointService } from 'src/endpoint/services/endpoint/endpoint.service';

@ApiTags("Endpoints")
@Controller('endpoint')
export class EndpointController {
    constructor(
        private endpointService: EndpointService,
        private endpointParams: EndpointParamsService,
        private authService: AuthenticationService,
        private connectionService: ConnectionService
        ){}

    @ApiOperation({
        summary: "Create a new a endpoint.",
        description:"Create new endpoint"
    })
    @Post('create')
    async createEndpoint(
        @Body() body: createEndpointDto,
        @Req() request: Request 
    ){
        // Verify if requesting user (from token) has access to this workspace
        if(await this.authService.userHasAccess(request.headers['authorization'], body.workspace_id) === false){
            // return {status: false, message:"Unauthorized", data:[]}
            throw new UnauthorizedException('Unauthorized access to this workspace');
        }
        return await this.endpointService.createEndpoint(
            body.summary,
            body.description,
            body.url,
            body.method,
            body.sample_request_object,
            body.sample_response_object,
            body.sample_error_object,
            body.service_id,
            body.workspace_id,
            body.target_industry,
            body.target_region,
            body.target_country,
            body.created_by,
            body.params,
            body.headers,
            body.multi_part,
            body.call_fee,
            body.version
        );
    }

    @ApiOperation({summary:"Get all public endpoints"})
    @ApiQuery({ name: 'industry', required: false, type: String })
    @ApiQuery({ name: 'region', required: false, type: String })
    @ApiQuery({ name: 'country', required: false, type: String })
    @ApiQuery({ name: 'workspace', required: false, type: String })
    @ApiQuery({ name: 'service', required: false, type: String })
    @Get('public/all')
    @Public()
    async getAllPublicEndpoints(
        @Query('industry') industry?: string,
        @Query('region') region?: string,
        @Query('country') country?: string,
        @Query('workspace') workspace?: string,
        @Query('service') service?: string
    ){
        if(industry || region || country || workspace || service){
            return this.endpointService.filterPublicEndpoints(industry, region, country, workspace, service); 
        }else{
            return this.endpointService.getAllPublicEndpoints();
        }
    }

    // Gets open public endpoints
    @ApiOperation({summary:"Get all open public endpoints"})
    @Get('public/open')
    @Public()
    async getOpenPublicEndpoints(){
        return this.endpointService.getOpenPublicEndpoints();
    }

    @Public()
    @Get('/count')
    async countAllEndpoints(){
        return await this.endpointService.countAllEndpoints();
    }

    @Public()
    @ApiOperation({summary:"Get endpoint details by ID"})
    @Get('details/:endpoint_id')
    async getEndpointDetails(
        @Param('endpoint_id') endpoint_id: string
    ){
        const endpoint = await this.endpointService.getPublicEndpointById(endpoint_id);
        if(endpoint){
            const endpoint_params = await this.endpointParams.getParams(endpoint.id);
            const public_endpoint = await this.endpointService.toPublicEndpoints([endpoint])
            return {status: true, message:"Success", data: {endpoint:public_endpoint[0], params:endpoint_params.data}}
        }else{
            return {status: false, message:"Endpoint is not found"}
        }
    }

    @Public()
    @ApiOperation({summary:"Get endpoint details by ID"})
    @Get('details/:endpoint_id/private')
    async getPrivateEndpointDetails(
        @Param('endpoint_id') endpoint_id: string
    ){
        const endpoint = await this.endpointService.getPrivateEndpointById(endpoint_id);
        if(endpoint){
            const endpoint_params = await this.endpointParams.getParams(endpoint.id);
            const public_endpoint = await this.endpointService.toPublicEndpoints([endpoint])
            return {status: true, message:"Success", data: {endpoint:public_endpoint[0], params:endpoint_params.data}}
        }else{
            return {status: false, message:"Endpoint is not found"}
        }
    }

    @ApiOperation({summary:"Get endpoints under a service"})
    @Get('service/:service_id')
    async getServiceEndpoints(
        @Param('service_id') service_id: string,
        @Req() request: Request 
    ){
        const endpoints = await  this.endpointService.getServiceEndpoints(service_id);

        // Verify if requesting user (from token) has access to this workspace
        const workspace_id = endpoints.data.length > 0 ? endpoints.data[0].workspace_id : "";
        if(await this.authService.userHasAccess(request.headers['authorization'], workspace_id) === false){
            throw new UnauthorizedException('Unauthorized access to this workspace');
        }
        return endpoints; //If all is well, return the endpoints
    }

    @ApiOperation({summary:"Get endpoints under a worskpace"})
    @Get('workspace/:workspace_id')
    async getWorkspaceEndpoints(
        @Param('workspace_id') workspace_id: string,
        @Req() request: Request 
    ){
        // Verify if requesting user (from token) has access to this workspace
        if(await this.authService.userHasAccess(request.headers['authorization'], workspace_id) === false){
            // return {status: false, message:"Unauthorized", data:[]}
            throw new UnauthorizedException('Unauthorized access to this workspace');
        }
        return await this.endpointService.getWorkspaceEndpoints(workspace_id);
    }

    @Patch('update')
    async updateEndpoint(
        @Body() body: UpdateEndpointDto,
        @Req() request: Request 
    ){
        const endpoint = await this.endpointService.getEndpointById(body.endpoint_id);
        if(endpoint){
            // Verify if requesting user (from token) has access to this workspace
            if(await this.authService.userHasAccess(request.headers['authorization'], endpoint.workspace_id) === false){
                // return {status: false, message:"Unauthorized", data:[]}
                throw new UnauthorizedException('Unauthorized access to this workspace');
            }

            return await this.endpointService.updateEndpoint(
                body.endpoint_id,
                body.summary,
                body.description,  
                body.endpoint,  
                body.method,
                body.sample_request_object,
                body.sample_response_object,
                body.sample_error_object,
                body.target_industry,
                body.target_region,
                body.target_country,
                body.params,
                body.multi_part,
                body.headers,
                body.service_id,
                body.call_fee,
                body.version
            )
        }else{
            return {status: false, message:"Invalid endpoint", data:[]}
        }
    }

    @Put('publish/:endpoint_id')
    async publishEndpoint(
        @Param('endpoint_id') endpoint_id: string,
        @Query('access') access: string,
        @Req() request: Request 
    ){
        const endpoint = await this.endpointService.getEndpointById(endpoint_id);
        if(endpoint){
            // Verify if requesting user (from token) has access to this workspace
            if(await this.authService.userHasAccess(request.headers['authorization'], endpoint.workspace_id) === false){
                throw new UnauthorizedException('Unauthorized access to this workspace');
            }
            return await this.endpointService.publishEndpoint(endpoint_id, access);
        }else{
            return {status: false, message:"Invalid endpoint"}
        }
    }

    @Put('unpublish/:endpoint_id')
    async unpublishEndpoint(
        @Param('endpoint_id') endpoint_id: string,
        @Req() request: Request 
    ){
        const endpoint = await this.endpointService.getEndpointById(endpoint_id);
        if(endpoint){
            // Verify if requesting user (from token) has access to this workspace
            if(await this.authService.userHasAccess(request.headers['authorization'], endpoint.workspace_id) === false){
                // return {status: false, message:"Unauthorized", data:[]}
                throw new UnauthorizedException('Unauthorized access to this workspace');
            }
            return await this.endpointService.unpublishEndpoint(endpoint_id);
        }else{
            return {status: false, message:"Invalid endpoint"}
        }
    }

    @Delete('delete/:endpoint_id')
    async deleteEndpoint(
        @Param('endpoint_id') endpoint_id: string,
        @Req() request: Request 
    ){
        const endpoint = await this.endpointService.getEndpointById(endpoint_id);
        if(endpoint){
            // Verify if requesting user (from token) has access to this workspace
            if(await this.authService.userHasAccess(request.headers['authorization'], endpoint.workspace_id) === false){
                // return {status: false, message:"Unauthorized", data:[]}
                throw new UnauthorizedException('Unauthorized access to this workspace');
            }
            return await this.endpointService.deleteEndpoint(endpoint_id);
        }else{
            return {status: false, message:"Invalid endpoint"}
        }
    }

    // Get distinct industries
    @Public()
    @ApiOperation({summary:"Get distinct industries"})
    @Get('target/industries')
    async getIndustries(){
        return await this.endpointService.getDistinctIndustries();
    }

    // Get district countries
    @Public()
    @ApiOperation({summary:"Get distinct countries"})
    @Get('target/countries')
    async getCountries(){
        return await this.endpointService.getDistinctCountries();
    }

     /** ENDPOINT GROUPS */
     // Creates endpoint group
    @ApiOperation({summary:"Create endpoint group"})
    @Post('group/create')
    async createEndpointGroup(
        @Body() body: EndpointGroupDto
    ){
        return await this.endpointService.createEndpointGroup(body.name, body.description, body.workspace_id, body.created_by);
    }

    // Gets all endpoint groups by workspace id
    @Public()
    @ApiOperation({summary:"Get endpoint groups by workspace id"})
    @Get('groups/workspace/:workspace_id')
    async getAllEndpointGroups(@Param('workspace_id') workspace_id: string){
        return await this.endpointService.findEndpointGroupsByWorkspaceId(workspace_id);
    }

    // Gets group members by group id
    @Public()
    @ApiOperation({summary:"Get group members by group id"})
    @Get('group/members/:group_id')
    async getGroupMembers(@Param('group_id') group_id: string){
        return await this.endpointService.findGroupMembersByGroupId(group_id);
    }

    // Adds endpoint to group
    @Public()
    @ApiOperation({summary:"Adds array of endpoints to group"})
    @Post('group/add/members')
    async addEndpointsToGroup(
        @Body() body: AddEndpointToGroupDto
    ){
        return await this.endpointService.addEndpointsToGroup(body.endpoint_ids, body.group_id, body.created_by);
    }

    // Removes endpoint from group
    @ApiOperation({summary:"Remove endpoint from group"})
    @Delete('group/remove/member/:endpoint_id/group/:group_id')
    async removeEndpointFromGroup(
        @Param('endpoint_id') endpoint_id: string,
        @Param('group_id') group_id: string,
    ){
        return await this.endpointService.removeEndpointFromGroup(endpoint_id, group_id);
    }

    // Updates endpoint group
    @ApiOperation({summary:"Update endpoint group"})
    @Patch('group/update')
    async updateEndpointGroup(
        @Body() body: EndpointGroupDto
    ){
        return await this.endpointService.updateEndpointGroup(body.group_id, body.name, body.description);
    }

    // Deletes endpoint group
    @ApiOperation({summary:"Delete endpoint group"})
    @Delete('group/delete/:group_id')
    async deleteEndpointGroup(@Param('group_id') group_id: string){
        // Make sure there are no active connections to this group
        const connections = await this.connectionService.countConnectionsByGroup(group_id);
        if(connections.data > 0){
            return {status: false, message:"This group has active connections. Please cancel all connections before deleting this group"}
        }else{
            return await this.endpointService.deleteGroup(group_id);
        }
    }

    //find Groups By Endpoint Id
    @Public()
    @ApiOperation({summary:"Get groups by endpoint id"})
    @Get('groups/endpoint/:endpoint_id')
    async findGroupsByEndpointId(@Param('endpoint_id') endpoint_id: string){
        return await this.endpointService.findGroupsByEndpointId(endpoint_id);
    }
}

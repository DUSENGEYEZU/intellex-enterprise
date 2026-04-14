import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EndpointParamsService } from './endpoint-params.service';
import { CreateEndpointParamDto, UpdateEndpointParamDto } from './endpoint-params.dto';

@ApiTags("Endpoint Parameters")
@Controller('endpoint-params')
export class EndpointParamsController {
    constructor(private endpointParamsService: EndpointParamsService){}

    @Post('create')
    async createParam(@Body() body: CreateEndpointParamDto){
        return await this.endpointParamsService.createParam(body.kind, body.key, body.value, body.endpoint_id, body.is_required)
    }

    @Get('endpoint/:endpoint_id')
    async getParams(@Param('endpoint_id') endpoint_id: string){
        return await this.endpointParamsService.getParams(endpoint_id);
    }

    @Patch('update')
    async updateParam(@Body() body: UpdateEndpointParamDto){
        return await this.endpointParamsService.updateParam(body.param_id, body.key, body.value, body.is_required);
    }

    @Delete('delete/param/:param_id')
    async deleteParam(@Param('param_id') param_id: string){
        return await this.endpointParamsService.deleteParam(param_id);
    }
}
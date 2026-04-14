import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EndpointParamsEntity } from './endpoint-params.entity';

@Injectable()
export class EndpointParamsService {
    constructor(@InjectRepository(EndpointParamsEntity) private endpointParams: Repository<EndpointParamsEntity>){}

    async createParam(kind: string, key: string, value: string, endpoint_id: string, is_required: boolean){
        const param = await this.endpointParams.save(
            this.endpointParams.create({
                kind: kind,
                key: key,
                value: value,
                is_required: is_required,
                endpoint_id: endpoint_id
            })
        );
        return await {status: true, message:"Success", data: param};
    }

    async getParams(endpoint_id: string){
        const param = await this.endpointParams.findBy({endpoint_id: endpoint_id})
        return await {status: true, message:"Success", data: param};
    }

    async updateParam(param_id: string, key: string, value: string, is_required: boolean){
        const param = await this.endpointParams.findOneBy({id: param_id})
        param.key = key;
        param.value = value;
        param.is_required = is_required;
        await this.endpointParams.save(param)
        return await {status: true, message:"Success", data: param};
    }

    async deleteParam(param_id: string){
        await this.endpointParams.delete({id: param_id})
        return await {status: true, message:"Deleted successfully"};
    }
}
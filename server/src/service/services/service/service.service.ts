import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceEntity } from 'src/service/entities/service.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ServiceService {
    constructor(
        @InjectRepository(ServiceEntity) private serviceEntity: Repository<ServiceEntity>
    ){}

    async createService(service_name: string, description: string, workspace_id: string, created_by: string){
        try{
            const service = await this.serviceEntity.save(
                this.serviceEntity.create({
                    name: service_name,
                    description: description,
                    workspace_id: workspace_id,
                    created_by: created_by
                })
            );
            return {status: true, data: service}
        }catch(e){
            return {status: false, message: e.toString()}
        }
    }

    async updateService(service_id: string, service_name: string, description: string){
        const service = await this.serviceEntity.findOneBy({id: service_id});
        service.name = service_name;
        service.description = description;
        const updated = this.serviceEntity.save(service);
        return {status: true, data: updated}
    }

    async findServiceById(service_id: string) {
        return await this.serviceEntity.findOneBy({id: service_id})
    }

    async getWorkspaceServices(workspace_id: string){
        const services = await this.serviceEntity.findBy({workspace_id: workspace_id});
        return {status: true, data: services}
    }

    // Get public workspace service. The caller is another workspace who has been granted access to this service
    async getPublicWorkspaceServices(workspace_id: string){
        const services = await this.serviceEntity.findBy({workspace_id: workspace_id, is_public: true});
        return {status: true, data: services}
    }

    async deleteService(service_id: string){
        try{
            await this.serviceEntity.delete({id: service_id});
            return {status: true, message:"The service has been deleted successfully"}
        }catch(e){
            return {status: false, message: e.toString()}
        }
    }

    async changeServicePublicStatus(service_id: string, is_public: boolean){
        const service = await this.serviceEntity.findOneBy({id: service_id});
        if(service){
            service.is_public = Boolean(is_public);
            try{
                await this.serviceEntity.save(service);
                return {status: true, message:"Success", data: service}
            }catch(e){
                return {status: false, message: e.toString()}
            }
        }
    }
}

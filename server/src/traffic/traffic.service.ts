import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TrafficEntity } from './traffic.entity';
import { Repository } from 'typeorm';
import { WorkspaceEntity } from 'src/workspace/entities/workspace.entity';
import { ServiceEntity } from 'src/service/entities/service.entity';
import { EndpointEntity } from 'src/endpoint/entities/endpoint.entity';

@Injectable()
export class TrafficService {
    constructor(@InjectRepository(TrafficEntity) private trafficEntity: Repository<TrafficEntity>){}

    async createTraffic(consumer_workspace_id: string, producer_workspace_id: string, service_id: string, endpoint_id: string, status: string, remarks:string="Success"){
        this.trafficEntity.save(
            this.trafficEntity.create({
                consumer_workspace_id: consumer_workspace_id,
                producer_workspace_id: producer_workspace_id,
                service_id: service_id,
                endpoint_id: endpoint_id,
                status: status, remarks: remarks
            })
        )
    }

    /*
    async getTrafficHistorybyDates(start_date: string, end_date: string){
    }
    */

    async getTrafficByConsumerWorkspace(consumer_workspace_id: string, start_date: string, end_date: string) {
        const results = await this.trafficEntity
            .createQueryBuilder('t')
            .select([
                't.status AS t_status', 
                't.remarks AS t_remarks', 
                't.created_at AS t_created_at', 
                't.service_id AS serviceId',  // Explicit casting to UUID
                's.name AS service_name', 
                't.endpoint_id AS endpoint_id', // Explicit casting to UUID
                'e.summary AS endpoint_summary', 
                't.consumer_workspace_id AS consumer_workspace_id', // Explicit casting to UUID
                'pw.name AS consumer_workspace_name'
            ])
            .leftJoin(WorkspaceEntity, 'pw', 't.consumer_workspace_id::uuid = pw.id') // Explicit casting to UUID
            .leftJoin(ServiceEntity, 's', 't.service_id::uuid = s.id') // Explicit casting to UUID
            .leftJoin(EndpointEntity, 'e', 't.endpoint_id::uuid = e.id') // Explicit casting to UUID
            .where('t.consumer_workspace_id = :consumerWorkspaceId')  // Explicit casting in WHERE clause
            .andWhere('t.created_at BETWEEN :startDate AND :endDate')
            .setParameter('consumerWorkspaceId', consumer_workspace_id) // Parameter as string, TypeORM handles binding
            .setParameter('startDate', new Date(start_date + 'T00:00:00')) // Ensure date format consistency
            .setParameter('endDate', new Date(end_date + 'T23:59:59')) // Ensure date format consistency
            .orderBy('t.created_at', 'DESC')
            .getRawMany();
    
        return { status: true, message: "Success", data: results };
    }
    
    

    async getTrafficByProducerWorkspace(producer_workspace_id: string, start_date: string, end_date: string){
    
        const results = await this.trafficEntity
        .createQueryBuilder('t')
        .select([
            't.service_id::uuid AS serviceId',
            's.name AS service_name',
            't.endpoint_id::uuid AS endpoint_id',
            'e.summary AS endpoint_summary',
            't.created_at',
            't.producer_workspace_id::uuid AS producer_workspace_id',
            'pw.name AS producer_workspace_name',
            't.status',
            't.remarks'
        ])
        .leftJoin(WorkspaceEntity, 'pw', 't.producer_workspace_id::uuid = pw.id::uuid')
        .leftJoin(ServiceEntity, 's', 't.service_id::uuid = s.id::uuid')
        .leftJoin(EndpointEntity, 'e', 't.endpoint_id::uuid = e.id::uuid')
        .where('t.producer_workspace_id::uuid = :producerWorkspaceId')
        .andWhere('t.created_at BETWEEN :startDate AND :endDate')
        .setParameter('producerWorkspaceId', producer_workspace_id)
        .setParameter('startDate', start_date+' 00:00')
        .setParameter('endDate', end_date+' 23:59')
        .getRawMany();

        return {status: true, message:"Success", data: results}
    }

    async countAllEndpointCalls(endpoint_id: string){
        const count = await this.trafficEntity.countBy({endpoint_id: endpoint_id});
        return await {status: true, message:"Success", data: count}
    }

    async countAllTrafficRecords(){
        const count = await this.trafficEntity.count();
        return {status: true, message:"Success", data: count};
    }
}

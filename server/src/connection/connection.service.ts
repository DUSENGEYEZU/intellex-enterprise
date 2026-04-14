import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectionEntity } from './connection.entity';
import { ConnectionStatuses } from './connection.dto';
import { v4 as uuidv4 } from 'uuid';
import { ServiceEntity } from 'src/service/entities/service.entity';
import { EndpointEntity } from 'src/endpoint/entities/endpoint.entity';
import { WorkspaceEntity } from 'src/workspace/entities/workspace.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { UtilsService } from 'src/utils/services/utils.service';
import { EmailTemplates } from 'src/utils/email.template';
import { Repository } from 'typeorm';
import { UserWorkspaceEntity } from 'src/workspace/entities/user_workspace.entity';
import { EndpointGroupEntity } from 'src/endpoint/entities/endpoint-group.entity';

enum NotificationPurpose{
    ACCESS_REQUEST= 'ACCESS_REQUEST',
    ACCESS_DENIED = 'ACCESS_DENIED',
    ACCESS_GRANTED = 'ACCESS_GRANTED'
}
enum NotificationResource{
    ENDPOINT = 'ENDPOINT',
    ENDPOINT_GROUP = 'ENDPOINT_GROUP'
}

@Injectable()
export class ConnectionService {
    constructor(
        @InjectRepository(ConnectionEntity) private connectionEntity: Repository<ConnectionEntity>,
        @InjectRepository(UserEntity) private userEntity: Repository<UserEntity>,
        @InjectRepository(EndpointEntity) private endpointEntity: Repository<EndpointEntity>,
        @InjectRepository(EndpointGroupEntity) private endpointGroupEntity: Repository<EndpointGroupEntity>,
        @InjectRepository(UserWorkspaceEntity) private userWorkspaceEntity: Repository<UserWorkspaceEntity>,
        private utils: UtilsService
    ){}

    /** Avoid Postgres "invalid input syntax for type uuid" when the client has no main workspace yet */
    private normalizeWorkspaceId(raw: string | undefined | null): string | null {
        if (raw == null) {
            return null;
        }
        const t = String(raw).trim();
        if (t === '' || t === 'null' || t === 'undefined') {
            return null;
        }
        const uuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuid.test(t) ? t : null;
    }

    async createConnection(
        service_id: string,
        endpoint_id: string,
        group_id: string,
        consumer_workspace_id: string,
        producer_workspace_id: string,
        created_by: string,
        purpose: string,
    ){
        let connection; // Placeholder which will holder details of the create connection
        // Check consumer workspace does not already have access to this endpoint or group
        let connExists;
        if(endpoint_id){ // Check if connection already exists for this endpoint
            connExists = await this.connectionEntity.findOneBy({consumer_workspace_id: consumer_workspace_id, endpoint_id: endpoint_id});
        }else if(group_id){ // Check if connection already exists for this group
            connExists = await this.connectionEntity.findOneBy({consumer_workspace_id: consumer_workspace_id, endpoint_group_id: group_id});
        }
        
        if(connExists && connExists.status !== ConnectionStatuses.DENIED){
            if(connExists.status === ConnectionStatuses.NEW ){
                return {status: false, message: "You already requested access to this API. Please wait for the provider's decision.", data: {}}
            }
            if(connExists.status === ConnectionStatuses.GRANTED){
                return {status: false, message:"You already have access to this api" }
            }
        }else{
            // This is a new connection, so let's create a new one
            connection = await this.connectionEntity.save(
                this.connectionEntity.create({
                    service_id: service_id,
                    endpoint_id: endpoint_id,
                    endpoint_group_id: group_id,
                    consumer_workspace_id: consumer_workspace_id,
                    producer_workspace_id: producer_workspace_id,
                    purpose: purpose,
                    created_by: created_by,
                    granted_by: created_by // Mandatory: this will be filled by created_by by default. It will be later replaced by the grantor_id automatically when connection is granted or denied.
                })
            );
        }
        if(endpoint_id){ //Notify the producer about the endpoint
            this.sendEmailNotification(NotificationPurpose.ACCESS_REQUEST, NotificationResource.ENDPOINT, created_by, producer_workspace_id, endpoint_id);
        }
        if(group_id){ //Notify the producer about the group
            this.sendEmailNotification(NotificationPurpose.ACCESS_REQUEST,  NotificationResource.ENDPOINT_GROUP, created_by, producer_workspace_id, group_id);
        }
        return {status: true, message: "Success", data: connection}
    }

    async grantConnection(connection_id: string, granted_by: string){
        const connection = await this.connectionEntity.findOneBy({id: connection_id});
        if(connection.endpoint_id){
            connection.api_key = `apk_`+uuidv4(); //Prefix with 'apk_' to indicate api key for single endpoint
        }
        if(connection.endpoint_group_id){
            connection.api_key = `gapk_`+uuidv4(); //Prefix with 'gapk_' to indicate group api key
        }
        connection.granted_by = granted_by;
        connection.status = ConnectionStatuses.GRANTED;
        connection.granted_at = new Date().toISOString();
        const saved = await this.connectionEntity.save(connection);
        if(saved){
            // Notify the consumer
            if(connection.endpoint_id){ //Notify the consumer about the endpoint
                this.sendEmailNotification(NotificationPurpose.ACCESS_GRANTED, NotificationResource.ENDPOINT, connection.created_by, connection.producer_workspace_id, connection.endpoint_id);
            }
            if(connection.endpoint_group_id){ //Notify the consumer about the group
                this.sendEmailNotification(NotificationPurpose.ACCESS_GRANTED,  NotificationResource.ENDPOINT_GROUP, connection.created_by, connection.producer_workspace_id, connection.endpoint_id);
            }

            return {status: true, message:"Success", data: saved}
        }else{
            return {status: false, message:"Failed to grant connection."}
        }
    }

    async cancelConnection(connection_id: string){
        const connection = await this.connectionEntity.findOneBy({id: connection_id});
        connection.status = ConnectionStatuses.DENIED;
        connection.api_key = ""; //Cancel api-key
        const denied = await this.connectionEntity.save(connection);

        // Notify the consumer
        if(connection.endpoint_id){ //Notify the consumer about the endpoint
            this.sendEmailNotification(NotificationPurpose.ACCESS_DENIED, NotificationResource.ENDPOINT, connection.created_by, connection.producer_workspace_id, connection.endpoint_id);
        }
        if(connection.endpoint_group_id){ //Notify the consumer about the group
            this.sendEmailNotification(NotificationPurpose.ACCESS_DENIED,  NotificationResource.ENDPOINT_GROUP, connection.created_by, connection.producer_workspace_id, connection.endpoint_id);
        }

        return {status: true, message:"Success", data: denied}
    }

    // Consumer invokes this service when they want to track status of connections they have requested.
    async getConsumerWorkspaceConnections(consumer_workspace_id: string){
        const wid = this.normalizeWorkspaceId(consumer_workspace_id);
        if (!wid) {
            return { status: true, message: 'Success', data: [] };
        }
        const connections = await this.connectionEntity
        .createQueryBuilder('c')
        .select([
            'c.id AS id',
            'c.service_id AS service_id',
            's.name AS service_name',
            'e.summary AS endpoint_summary',
            'e.id AS endpoint_id',
            'e.method AS method',
            'e.path AS path',
            'e.sample_response_object AS sample_response_object',
            'c.producer_workspace_id AS producer_workspace_id',
            'w_producer.name AS producer_workspace_name',
            'c.api_key AS api_key',
            'c.status AS status',
            'c.created_by AS requester_user_id',
            `CONCAT ('${process.env.DOMAIN_HOST}/traffic/pt/', e.id, e.path) AS url`,
            "CONCAT(u_requester.first_name, ' ', u_requester.last_name) AS requester_user_name",
            'c.granted_by AS granted_by',
            "CONCAT(u_grantor.first_name, ' ', u_grantor.last_name) AS grantor_user_name",
            'c.created_at AS created_at',
            'c.granted_at AS granted_at',
        ])
        .innerJoin(ServiceEntity, 's', 'NULLIF(c.service_id, \'\')::uuid = s.id') // Must be nulled because they will not always have values
        .innerJoin(EndpointEntity, 'e', 'NULLIF(c.endpoint_id, \'\')::uuid = e.id') // Must be nulled because they will not always have values
        .innerJoin(WorkspaceEntity, 'w_consumer', 'c.consumer_workspace_id::uuid = w_consumer.id')
        .innerJoin(WorkspaceEntity, 'w_producer', 'c.producer_workspace_id::uuid = w_producer.id')
        .innerJoin(UserEntity, 'u_requester', 'c.created_by::uuid = u_requester.id')
        .innerJoin(UserEntity, 'u_grantor', 'c.granted_by::uuid = u_grantor.id')
        .where('c.consumer_workspace_id = :consumerWorkspaceId')
        .setParameter('consumerWorkspaceId', wid)
        .getRawMany();
        
        return {status: true, message:"Success", data: connections}
    }

    async getConsumerWorkspaceConnectionsOnGroups(consumer_workspace_id: string){
        const wid = this.normalizeWorkspaceId(consumer_workspace_id);
        if (!wid) {
            return { status: true, message: 'Success', data: [] };
        }
        const connections = await this.connectionEntity
        .createQueryBuilder('c')
        .select([
            'c.id AS id',
            'eg.name AS group_name',
            'eg.id AS group_id',
            'eg.description AS group_description',
            'c.producer_workspace_id AS producer_workspace_id',
            'w_producer.name AS producer_workspace_name',
            'c.api_key AS api_key',
            'c.status AS status',
            'c.created_by AS requester_user_id',
            "CONCAT(u_requester.first_name, ' ', u_requester.last_name) AS requester_user_name",
            'c.granted_by AS granted_by',
            "CONCAT(u_grantor.first_name, ' ', u_grantor.last_name) AS grantor_user_name",
            'c.created_at AS created_at',
            'c.granted_at AS granted_at',
        ])
        .innerJoin(EndpointGroupEntity, 'eg', 'c.endpoint_group_id::uuid = eg.id')
        .innerJoin(WorkspaceEntity, 'w_consumer', 'c.consumer_workspace_id::uuid = w_consumer.id')
        .innerJoin(WorkspaceEntity, 'w_producer', 'c.producer_workspace_id::uuid = w_producer.id')
        .innerJoin(UserEntity, 'u_requester', 'c.created_by::uuid = u_requester.id')
        .innerJoin(UserEntity, 'u_grantor', 'c.granted_by::uuid = u_grantor.id')
        .where('c.consumer_workspace_id = :consumerWorkspaceId')
        .setParameter('consumerWorkspaceId', wid)
        .getRawMany();
        
        return {status: true, message:"Success", data: connections}
    }

    // Producer invokes this service when they want to see external entities connected to their workspace.
    async getProducerWorkspaceConnections(producer_workspace_id: string){
        const wid = this.normalizeWorkspaceId(producer_workspace_id);
        if (!wid) {
            return { status: true, message: 'Success', data: [] };
        }
        const connections = await this.connectionEntity 
        .createQueryBuilder('c')
        .select([
            'c.id AS id',
            'c.service_id AS service_id',
            's.name AS service_name',
            'e.summary AS endpoint_summary',
            'e.id AS endpoint_id',
            'c.consumer_workspace_id AS consumer_workspace_id',
            'w_consumer.name AS consumer_workspace_name',
            'c.api_key AS api_key',
            'c.status AS status',
            'c.purpose AS purpose',
            'c.created_by AS requester_user_id',
            "CONCAT(u_requester.first_name, ' ', u_requester.last_name) AS requester_user_name",
            'c.granted_by AS granted_by',
            "CONCAT(u_grantor.first_name, ' ', u_grantor.last_name) AS grantor_user_name",
            'c.created_at AS created_at',
            'c.granted_at AS granted_at',
        ])
        .innerJoin(ServiceEntity, 's', 'NULLIF(c.service_id, \'\')::uuid = s.id') // Must be nulled because they will not always have values
        .innerJoin(EndpointEntity, 'e', 'NULLIF(c.endpoint_id, \'\')::uuid = e.id') // Must be nulled because they will not always have values
        .innerJoin(WorkspaceEntity, 'w_consumer', 'c.consumer_workspace_id::uuid = w_consumer.id')
        .innerJoin(WorkspaceEntity, 'w_producer', 'c.producer_workspace_id::uuid = w_producer.id')
        .innerJoin(UserEntity, 'u_requester', 'c.created_by::uuid = u_requester.id')
        .innerJoin(UserEntity, 'u_grantor', 'c.granted_by::uuid = u_grantor.id')
        .where('c.producer_workspace_id = :producerWorkspaceId')
        .setParameter('producerWorkspaceId', wid)
        .getRawMany();
        return {status: true, message:"Success", data: connections}
    }

    async getProducerConnectionsOnGroups(producer_workspace_id: string){
        const wid = this.normalizeWorkspaceId(producer_workspace_id);
        if (!wid) {
            return { status: true, message: 'Success', data: [] };
        }
        const connections = await this.connectionEntity 
        .createQueryBuilder('c')
        .select([
            'c.id AS id',
            'c.service_id AS service_id',
            'eg.name AS group_name',
            'eg.id AS group_id',
            'eg.description AS group_description',
            'c.consumer_workspace_id AS consumer_workspace_id',
            'w_consumer.name AS consumer_workspace_name',
            'c.api_key AS api_key',
            'c.status AS status',
            'c.purpose AS purpose',
            'c.created_by AS requester_user_id',
            "CONCAT(u_requester.first_name, ' ', u_requester.last_name) AS requester_user_name",
            'c.granted_by AS granted_by',
            "CONCAT(u_grantor.first_name, ' ', u_grantor.last_name) AS grantor_user_name",
            'c.created_at AS created_at',
            'c.granted_at AS granted_at',
        ])
        .innerJoin(EndpointGroupEntity, 'eg', 'c.endpoint_group_id::uuid = eg.id')
        .innerJoin(WorkspaceEntity, 'w_consumer', 'c.consumer_workspace_id::uuid = w_consumer.id')
        .innerJoin(WorkspaceEntity, 'w_producer', 'c.producer_workspace_id::uuid = w_producer.id')
        .innerJoin(UserEntity, 'u_requester', 'c.created_by::uuid = u_requester.id')
        .innerJoin(UserEntity, 'u_grantor', 'c.granted_by::uuid = u_grantor.id')
        .where('c.producer_workspace_id = :producerWorkspaceId')
        .setParameter('producerWorkspaceId', wid)
        .getRawMany();
        return {status: true, message:"Success", data: connections}
    }

    async getServiceConnections(service_id: string){
        const connection = await this.connectionEntity.findBy({service_id: service_id});
        return {status: true, message:"Success", data: connection}
    }

    async getConnectionByApiKey(api_key: string){
        return await this.connectionEntity.findOneBy({api_key: api_key});
    }

    async getConnectionById(connection_id: string) {
        return await this.connectionEntity.findOneBy({id: connection_id});
    }

    async countConnectionsByEndpoint(endpoint_id: string){
        const count = await this.connectionEntity.countBy({endpoint_id: endpoint_id, status: ConnectionStatuses.GRANTED});
        return await {status: true, data: count}
    }

    async countConnectionsByGroup(group_id: string){
        const count = await this.connectionEntity.countBy({endpoint_group_id: group_id, status: ConnectionStatuses.GRANTED});
        return await {status: true, data: count}
    }

    // Check if consumer has access to this endpoint
    async getEndpointWorkspaceConnection(endpoint_id: string, workspace_id: string){
        const connection = await this.connectionEntity.findOne({
            where: {
            endpoint_id: endpoint_id,
            consumer_workspace_id: workspace_id
          },
          order: {
            created_at: 'DESC' // Order by created_at in descending order to get the latest
          }
        });
        return await {status: true, message:"Success", data: connection}
    }
    // Check if consumer has access to this endpoint group
    async getGroupWorkspaceConnection(group_id: string, workspace_id: string){
        const connection = await this.connectionEntity.findOne({
            where: {
            endpoint_group_id: group_id,
            consumer_workspace_id: workspace_id
          },
          order: {
            created_at: 'DESC' // Order by created_at in descending order to get the latest
          }
        });
        return await {status: true, message:"Success", data: connection}
    }

    // Helpers
    async sendEmailNotification(purpose: NotificationPurpose, resource: NotificationResource, requester_user_id: string, producer_workspace_id: string, resource_id: string) {
        let resource_name: string; //Takes either endpoint.summary or group.name
        let subject: string;
        let message: string;
        let recipient_email: string;
        let recipient_name: string;

        //SCOPE: Set the rigth resource name (endpoint.summary or group.name)
        if(resource === NotificationResource.ENDPOINT){
            const endpoint = await this.endpointEntity.findOneBy({id: resource_id});
            resource_name = endpoint.summary;
        }else if(resource === NotificationResource.ENDPOINT_GROUP){
            const group = await this.endpointGroupEntity.findOneBy({id: resource_id});
            resource_name = group.name;
        }

        // PURPOSE
        if(purpose === NotificationPurpose.ACCESS_REQUEST){
            subject = "New API Access Request"
            const producer_wrkspc = await this.userWorkspaceEntity.findOneBy({workspace_id: producer_workspace_id})
            const producer = await this.userEntity.findOneBy({id: producer_wrkspc.user_id});
            const consumer = await this.userEntity.findOneBy({id: requester_user_id});
            message = EmailTemplates.APIAccessRequest(resource, consumer.first_name+' '+consumer.last_name, resource_name, resource_id, producer.first_name);
            recipient_email = producer.email;
            recipient_name = producer.first_name;
        }else if(purpose === NotificationPurpose.ACCESS_GRANTED){
            const requester = await this.userEntity.findOneBy({id: requester_user_id});
            recipient_email = requester.email;
            recipient_name = requester.first_name;
            subject = "Your API Access Request Has Been Granted"
            message = EmailTemplates.connectionGranted(resource, requester.first_name, resource_name, resource_id);
            
        }else if(purpose === NotificationPurpose.ACCESS_DENIED){
            const requester = await this.userEntity.findOneBy({id: requester_user_id});
            recipient_email = requester.email;
            recipient_name = requester.first_name;
            subject = "Your API Access Has Been Denied or Revoked"
            message = EmailTemplates.connectionDenied(resource, requester.first_name, resource_name, resource_id);
        }

        this.utils.sendEmail(recipient_email, recipient_name, subject, message);
    }
}
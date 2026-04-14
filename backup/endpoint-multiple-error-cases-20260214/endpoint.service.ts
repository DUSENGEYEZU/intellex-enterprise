import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm';
import { Method } from 'axios';
import { EndpointParamsEntity } from 'src/endpoint-params/endpoint-params.entity';
import { KeyValuePair } from 'src/endpoint/dtos/endpoint.dto';
import { EndpointGroupMemberEntity } from 'src/endpoint/entities/endpoint-group-member.entity';
import { EndpointGroupEntity } from 'src/endpoint/entities/endpoint-group.entity';
import { EndpointEntity } from 'src/endpoint/entities/endpoint.entity';
import { ServiceEntity } from 'src/service/entities/service.entity';
import { WorkspaceEntity } from 'src/workspace/entities/workspace.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EndpointService {
    constructor(
        @InjectRepository(EndpointEntity) private endpointEntity: Repository<EndpointEntity>,
        @InjectRepository(EndpointParamsEntity) private endpointParams: Repository<EndpointParamsEntity>,
        @InjectRepository(EndpointGroupEntity) private endpointGroup: Repository<EndpointGroupEntity>,
        @InjectRepository(EndpointGroupMemberEntity) private endpointGroupMember: Repository<EndpointGroupMemberEntity>
    ){}

    async createEndpoint(
        summary: string,
        description: string,  
        original_url: string,  
        method: Method,
        sample_request_object: string,
        sample_response_object: string,
        sample_error_object: string,
        service_id: string,
        workspace_id: string,
        target_industry: string,
        target_region: string,
        target_country: string,
        created_by: string,
        params: KeyValuePair[],
        headers: KeyValuePair[],
        multi_part: KeyValuePair[],
        call_fee: number,
        version: number
    ){
        try{
            // Get PATH from the original
            const url = new URL(original_url);
            const created = this.endpointEntity.create(
                {
                    summary: summary,
                    description: description,
                    original_url: original_url,
                    path: url.pathname + url.search,
                    method: method,
                    sample_request_object: sample_request_object,
                    sample_response_object: sample_response_object,
                    sample_error_object: sample_error_object,
                    service_id: service_id,
                    target_industry: target_industry,
                    target_region: target_region,
                    target_country: target_country,
                    workspace_id: workspace_id,
                    created_by: created_by,
                    call_fee: call_fee ? Number(call_fee) + (Number(call_fee) * Number(process.env.INTELLEX_FEE)) : 0,
                    version: version
                }
            );
            const endpoint = await this.endpointEntity.save(created);

             if((params && params.length > 0) || (headers && headers.length > 0) || (multi_part && multi_part.length > 0)){
                this.createEndpointParamsAndHeaders(params, headers, multi_part, endpoint.id);
            }
            return {status: true, message:"Success", data: endpoint}
        }catch(e){
            return {status: false, message:e.toString()}
        }
    }

    async updateEndpoint(
        endpoint_id: string,
        summary: string,
        description: string,  
        original_url: string,  
        method: Method,
        sample_request_object: string,
        sample_response_object: string,
        sample_error_object: string,
        target_industry= "",
        target_region= "",
        target_country= "",
        params: KeyValuePair[],
        multi_part: KeyValuePair[],
        headers: KeyValuePair[],
        service_id: string,
        call_fee: number,
        version: number
    ){
        const url = new URL(original_url);
        const endpoint = await this.endpointEntity.findOneBy({id: endpoint_id});
        endpoint.summary = summary;
        endpoint.description = description;
        endpoint.original_url = original_url;
        endpoint.path =  url.pathname + url.search;
        endpoint.method = method;
        endpoint.sample_request_object = sample_request_object;
        endpoint.sample_response_object = sample_response_object;
        endpoint.sample_error_object = sample_error_object;
        endpoint.target_industry = target_industry;
        endpoint.target_region = target_region;
        endpoint.target_country = target_country;
        endpoint.service_id = service_id;
        endpoint.call_fee = call_fee;
        endpoint.version = version;
        await this.endpointEntity.save(endpoint)
        // Update params
        if((params && params.length > 0) || (headers && headers.length > 0) || (multi_part && multi_part.length > 0)){
            // Delete existing params for this endpoint
            await this.endpointParams.delete({endpoint_id: endpoint_id});
            this.createEndpointParamsAndHeaders(params, headers, multi_part, endpoint_id);
        }
        return {status: true, message:"Success", data: {}}
    }

    createEndpointParamsAndHeaders(params: KeyValuePair[], headers: KeyValuePair[], multi_part: KeyValuePair[], endpoint_id: string){
        // Prepare param entities for insertion
        const paramEntities = params.map(param =>{
            const endpointParam = new EndpointParamsEntity();
            endpointParam.kind = 'param';
            endpointParam.key = param.key; 
            endpointParam.value = param.value;
            endpointParam.endpoint_id = endpoint_id;
            return endpointParam;
        })

        // Prepare header entities for insertion
        const headerEntities = headers.map(header => {
            const endpointHeader = new EndpointParamsEntity();
            endpointHeader.kind = 'header'; // You can differentiate between params and headers
            endpointHeader.key = header.key;
            endpointHeader.value = header.value;
            endpointHeader.endpoint_id = endpoint_id;
            return endpointHeader;
        }); 

        // Prepare multi_part entities for insertion
        const multiPartEntities = multi_part.map(multi_part => {
            const endpointMultiPart = new EndpointParamsEntity();
            endpointMultiPart.kind = 'multi_part';
            endpointMultiPart.key = multi_part.key;
            endpointMultiPart.value = multi_part.value;
            endpointMultiPart.endpoint_id = endpoint_id;
            return endpointMultiPart;
        })

        // Perform the bulk insert in a single transaction
        this.endpointParams.manager.transaction(async (transactionalEntityManager) => {
            if(params && params.length > 0) await transactionalEntityManager.insert(EndpointParamsEntity, paramEntities);  // Bulk insert params
            if(headers && headers.length > 0) await transactionalEntityManager.insert(EndpointParamsEntity, headerEntities);  // Bulk insert headers
            if(multi_part && multi_part.length > 0) await transactionalEntityManager.insert(EndpointParamsEntity, multiPartEntities);  // Bulk insert multi_part
        });
    }

    async getServiceEndpoints(service_id: string){
        const endpoints = await this.endpointEntity.findBy({service_id: service_id});
        const public_endpoints = await this.toPublicEndpoints(endpoints);
        return {status: true, message:"Success", data: public_endpoints}
    }

    async getWorkspaceEndpoints(workspace_id: string){
        const endpoints = await this.endpointEntity.findBy({workspace_id: workspace_id});
        const public_endpoints = await this.toPublicEndpoints(endpoints);
        return {status: true, message:"Success", data: public_endpoints}
    }

    async getEndpointById(endpoint_id: string): Promise<EndpointEntity>{
        try {
            const endpoint = await this.endpointEntity
            .createQueryBuilder('e')
            .select([
            'e.id AS id',
            'e.service_id AS service_id',
            's.name AS service_name',
            'e.summary AS summary',
            'e.call_fee AS call_fee',
            'e.description AS description',
            'e.method AS method',
            'e.is_open AS is_open',
            'e.original_url AS original_url',
            'e.path AS path',
            'e.version AS version',
            'e.sample_response_object AS sample_response_object',
            'e.sample_request_object AS sample_request_object',
            'e.sample_error_object AS sample_error_object',
            'e.target_industry AS target_industry',
            'e.target_region AS target_region',
            'e.target_country AS target_country',
            'w.name AS workspace_name',
            'w.id AS workspace_id',
            'w.industry_id AS industry_id',
            'e.created_at AS created_at',
            ])
            .innerJoin(ServiceEntity, 's', 'e.service_id::uuid = s.id')
            .innerJoin(WorkspaceEntity, 'w', 'e.workspace_id::uuid = w.id')
            .andWhere('e.id = :endpoint_id')
            .setParameter('endpoint_id', endpoint_id)
            .getRawOne();
            return endpoint;
        } catch (error) {
            console.error(`Failed to get endpoint by id: ${error.message}`);
            return null;
        }
    }

    async getPublicEndpointById(endpoint_id: string){
        const endpoint = await this.endpointEntity
        .createQueryBuilder('e')
        .select([
            'e.id AS id',
            'e.service_id AS service_id',
            's.name AS service_name',
            'e.summary AS summary',
            'e.call_fee AS call_fee',
            'e.description AS description',
            'e.method AS method',
            'e.path AS path',
            'e.version AS version',
            'e.sample_response_object AS sample_response_object',
            'e.sample_request_object AS sample_request_object',
            'e.sample_error_object AS sample_error_object',
            'e.target_industry AS target_industry',
            'e.target_region AS target_region',
            'e.target_country AS target_country',
            'w.name AS workspace_name',
            'w.id AS workspace_id',
            'w.industry_id AS industry_id',
            'e.created_at AS created_at',
        ])
        .innerJoin(ServiceEntity, 's', 'e.service_id::uuid = s.id')
        .innerJoin(WorkspaceEntity, 'w', 'e.workspace_id::uuid = w.id')
        .where('e.is_public = true')
        .andWhere('e.id = :endpoint_id')
        .setParameter('endpoint_id', endpoint_id)
        .getRawOne();
        return endpoint
    }


    async getPrivateEndpointById(endpoint_id: string){
        const endpoint = await this.endpointEntity
        .createQueryBuilder('e')
        .select([
            'e.id AS id',
            'e.service_id AS service_id',
            's.name AS service_name',
            'e.summary AS summary',
            'e.call_fee AS call_fee',
            'e.description AS description',
            'e.method AS method',
            'e.is_open AS is_open',
            'e.path AS path',
            'e.version AS version',
            'e.sample_response_object AS sample_response_object',
            'e.sample_request_object AS sample_request_object',
            'e.sample_error_object AS sample_error_object',
            'e.target_industry AS target_industry',
            'e.target_region AS target_region',
            'e.target_country AS target_country',
            'w.name AS workspace_name',
            'w.id AS workspace_id',
            'w.industry_id AS industry_id',
            'e.created_at AS created_at',
        ])
        .innerJoin(ServiceEntity, 's', 'e.service_id::uuid = s.id')
        .innerJoin(WorkspaceEntity, 'w', 'e.workspace_id::uuid = w.id')
        .where('e.id = :endpoint_id')
        .setParameter('endpoint_id', endpoint_id)
        .getRawOne();
        return endpoint
    }
    

    async publishEndpoint(endpoint_id: string, access:string = 'restricted'){
        await this.endpointEntity.update({id: endpoint_id},{is_public: true, is_open: access === 'restricted' ? false : true})
        return {status: true, message:"Success", data: {}}
    }

    async unpublishEndpoint(endpoint_id: string){
        await this.endpointEntity.update({id: endpoint_id},{is_public: false, is_open: false})
        return {status: true, message:"Success", data: {}}
    }

    async getAllPublicEndpoints(){
        const endpoints = await this.endpointEntity
        .createQueryBuilder('e')
        .select([
            'e.id AS id',
            'e.service_id AS service_id',
            's.name AS service_name',
            'e.summary AS summary',
            'e.call_fee AS call_fee',
            'e.description AS description',
            'e.method AS method',
            'e.is_open AS is_open',
            'e.path AS path',
            'e.version AS version',
            'e.sample_response_object AS sample_response_object',
            'e.sample_request_object AS sample_request_object',
            'e.sample_error_object AS sample_error_object',
            'e.target_industry AS target_industry',
            'e.target_region AS target_region',
            'e.target_country AS target_country',
            'w.name AS workspace_name',
            'w.id AS workspace_id',
            'w.industry_id AS industry_id',
            // Add subquery for params
            `(SELECT jsonb_agg(jsonb_build_object('key', ep.key, 'value', ep.value)) 
              FROM endpoint_params ep 
              WHERE ep.endpoint_id::uuid = e.id AND ep.kind = 'param') AS params`,
            // Add subquery for headers
            `(SELECT jsonb_agg(jsonb_build_object('key', ep.key, 'value', ep.value)) 
              FROM endpoint_params ep 
              WHERE ep.endpoint_id::uuid = e.id AND ep.kind = 'header') AS headers`,
            'e.created_at AS created_at',
        ])
        .innerJoin(ServiceEntity, 's', 'e.service_id::uuid = s.id')
        .innerJoin(WorkspaceEntity, 'w', 'e.workspace_id::uuid = w.id')
        .where('e.is_public = true')
        .getRawMany();
        const public_endpoints = await this.toPublicEndpoints(endpoints);
        return {status: true, message:"Success", data: public_endpoints}
    }

    async getOpenPublicEndpoints(){
        const endpoints = await this.endpointEntity
        .createQueryBuilder('e')
        .select([
            'e.id AS id',
            'e.service_id AS service_id',
            's.name AS service_name',
            'e.summary AS summary',
            'e.call_fee AS call_fee',
            'e.description AS description',
            'e.method AS method',
            'e.is_open AS is_open',
            'e.path AS path',
            'e.version AS version',
            'e.sample_response_object AS sample_response_object',
            'e.sample_request_object AS sample_request_object',
            'e.sample_error_object AS sample_error_object',
            'e.target_industry AS target_industry',
            'e.target_region AS target_region',
            'e.target_country AS target_country',
            'w.name AS workspace_name',
            'w.id AS workspace_id',
            'w.industry_id AS industry_id',
            // Add subquery for params
            `(SELECT jsonb_agg(jsonb_build_object('key', ep.key, 'value', ep.value)) 
              FROM endpoint_params ep 
              WHERE ep.endpoint_id::uuid = e.id AND ep.kind = 'param') AS params`,
            // Add subquery for headers
            `(SELECT jsonb_agg(jsonb_build_object('key', ep.key, 'value', ep.value)) 
              FROM endpoint_params ep 
              WHERE ep.endpoint_id::uuid = e.id AND ep.kind = 'header') AS headers`,
            'e.created_at AS created_at',
        ])
        .innerJoin(ServiceEntity, 's', 'e.service_id::uuid = s.id')
        .innerJoin(WorkspaceEntity, 'w', 'e.workspace_id::uuid = w.id')
        .where('e.is_public = true')
        .andWhere('e.is_open = true')
        .getRawMany();
        const public_endpoints = await this.toPublicEndpoints(endpoints);
        return {status: true, message:"Success", data: public_endpoints}
    }

    async filterPublicEndpoints(target_industry: string, target_region: string, target_country: string, workspace_id: string, service_id: string){
        // This first query returns everything if none of the conditions below are met
        const query = this.endpointEntity
            .createQueryBuilder('e')
            .select([
                'e.id AS id',
                'e.service_id AS service_id',
                's.name AS service_name',
                'e.summary AS summary',
                'e.call_fee AS call_fee',
                'e.description AS description',
                'e.method AS method',
                'e.is_open AS is_open',
                'e.path AS path',
                'e.version AS version',
                'e.sample_response_object AS sample_response_object',
                'e.sample_request_object AS sample_request_object',
                'e.sample_error_object AS sample_error_object',
                'e.target_industry AS target_industry',
                'e.target_region AS target_region',
                'e.target_country AS target_country',
                'w.name AS workspace_name',
                'e.workspace_id AS workspace_id',
                'w.industry_id AS industry_id',
                'e.created_at AS created_at',
            ])
            .innerJoin(ServiceEntity, 's', 'e.service_id::uuid = s.id')
            .innerJoin(WorkspaceEntity, 'w', 'e.workspace_id::uuid = w.id')
            .where('e.is_public = true')
        if(workspace_id){
            // Filter by workspace only
            query.andWhere('e.workspace_id = :workspace_id')
            .setParameter('workspace_id', workspace_id)
        }else if(service_id){
            // Filter by service only
            query.andWhere('e.service_id = :service_id')
            .setParameter('service_id', service_id)
        }else if(target_industry && !target_region && !target_country){
            // Filter by industry only
            query.andWhere('e.target_industry = :targetIndustry')
            .setParameter('targetIndustry', target_industry)
        }else if(!target_industry && target_region && !target_country){
            // Filter by region only
            query.andWhere('e.target_region = :targetRegion')
            .setParameter('targetRegion', target_region)
        }else if(!target_industry && !target_region && target_country){
            // Filter by country only
            query.andWhere('e.target_country = :targetCountry')
            .setParameter('targetCountry', target_country)
        }else if(!target_industry && target_region && target_country){
            // Filter by region and country
            query.andWhere('e.target_region =:targetRegion')
            .andWhere('e.target_country =:targetCountry')
            .setParameter('targetRegion', target_region)
            .setParameter('targetCountry', target_country)
        }else if(target_industry && target_region && !target_country){
            // Filter by industry and region
            query.andWhere('e.target_industry = :targetIndustry')
            .andWhere('e.target_region =:targetRegion')
            .setParameter('targetIndustry', target_industry)
            .setParameter('targetRegion', target_region)
        }else if(target_industry && !target_region && target_country){
            // Filter by industry and country
            query.andWhere('e.target_industry = :targetIndustry')
            .andWhere('e.target_country =:targetCountry')
            .setParameter('targetIndustry', target_industry)
            .setParameter('targetCountry', target_country)
        }else if(target_industry && target_region && target_country){
            // Filter by industry, region and country
            query.andWhere('e.target_industry = :targetIndustry')
            .andWhere('e.target_region = :targetRegion')
            .andWhere('e.target_country = :targetCountry')
            .setParameter('targetIndustry', target_industry)
            .setParameter('targetRegion', target_region)
            .setParameter('targetCountry', target_country)
        }
        const endpoints = await query.getRawMany();
        const public_endpoints = await this.toPublicEndpoints(endpoints);
        return {status: true, message:"Success", data: public_endpoints};
    }

    async deleteEndpoint(endpoint_id: string){
        const deleted = await this.endpointEntity.delete({id: endpoint_id});
        return {status: true, message:"Deleted successfully", data: deleted}
    }

    async countAllEndpoints(){
        const count = await this.endpointEntity.count();
        return {status: true, message:"Success", data: count};
    }

    // Get distict country values
    async getDistinctCountries(){
        const countries = await this.endpointEntity
        .createQueryBuilder('e')
        .select('DISTINCT e.target_country AS country')
        .where('e.target_country IS NOT NULL AND e.target_country != \'\'')
        .orderBy('e.target_country')
        .getRawMany();
        return countries
    }

    // Get distict industries
    async getDistinctIndustries(){
        const industries = await this.endpointEntity
        .createQueryBuilder('e')
        .select('DISTINCT e.target_industry AS industry')
        .where('e.target_industry IS NOT NULL AND e.target_industry != \'\'')
        .orderBy('e.target_industry')
        .getRawMany();
        return industries
    }

    // Convert private endpoints to public endpoints.
    async toPublicEndpoints(endpoints: EndpointEntity[], strict=false): Promise<EndpointEntity[]>{
        // Construct public shareable endpoint. https://domain-host/path
        return await new Promise(resolve=>{
            const public_endpoints = []
            endpoints.forEach(endpoint=>{
                const params = endpoint.path.split('?')[1]
                let public_url = '';
                // Set public URL based API implementation version
                if(endpoint.version === 1) {
                    public_url = `${process.env.DOMAIN_HOST}/traffic/pt/${endpoint.id}${params ? '?'+params: ''}`;
                }else{
                    public_url = `${process.env.DOMAIN_HOST}/traffic/pt/${endpoint.id}${endpoint.path}`;
                }
                const service_name = 'service_name' in endpoint ? endpoint.service_name : '';
                const workspace_name = 'workspace_name' in endpoint ? endpoint.workspace_name : '';
                public_endpoints.push({
                    id: endpoint.id,
                    method: endpoint.method,
                    url: public_url,
                    is_public: endpoint.is_public,
                    is_open: endpoint.is_open,
                    original_url: strict == true ? "" : endpoint.original_url, //Strict for public consumption. False for internal use
                    summary: endpoint.summary,
                    call_fee: endpoint.call_fee,
                    description: endpoint.description,
                    sample_request_object: endpoint.sample_request_object,
                    sample_response_object: endpoint.sample_response_object,
                    sample_error_object: endpoint.sample_error_object,
                    service_id: endpoint.service_id,
                    service_name: service_name,
                    created_at: endpoint.created_at,
                    target_industry: endpoint.target_industry,
                    target_region: endpoint.target_region,
                    target_country: endpoint.target_country,
                    workspace_name: workspace_name,
                    workspace_id: endpoint.workspace_id,
                    version: endpoint.version
                })
            })
            resolve(public_endpoints)
        });
    }

    // Converts public endpoint to private endpoint
    async toPrivateEndpoint(public_endpoint: string){
        // The endpoint id is always at index 3.
        // Example: "https://example.com/{endpoint_id}/60505649/forbid-specific"
        // Split value ['https:', '', 'example.com', '{endpoint_id}', '60505649', 'forbid-specific']
        const endpoint_id = public_endpoint.split('/')[3];
        // Return original endpoint
        const endpoint = await this.endpointEntity.findOneBy({id: endpoint_id});
        return endpoint.original_url;
    }


    /** ENDPOINT GROUP */

    // Creates endpoint group
    async createEndpointGroup(name: string, description: string, workspace_id: string, created_by: string){
        const group = this.endpointGroup.create({
            name: name,
            description: description,
            workspace_id: workspace_id,
            created_by: created_by
        });
        const savedGroup = await this.endpointGroup.save(group);
        return { status: true, message: "Endpoint group created successfully", data: savedGroup };
    }

    // Finds endpoint groups by workspace_id
    async findEndpointGroupsByWorkspaceId(workspace_id: string) {
        const groups = await this.endpointGroup.findBy({ workspace_id: workspace_id });
        return { status: true, message: "Success", data: groups };
    }

    // Finds group members by group id
    async findGroupMembersByGroupId(group_id: string) {
        const members = await this.endpointGroupMember
            .createQueryBuilder('egm')
            .innerJoinAndSelect(EndpointEntity, 'e', 'e.id = egm.endpoint_id::uuid')
            .innerJoinAndSelect(EndpointGroupEntity, 'g', 'g.id = egm.group_id::uuid')
            .select([
            'e.id AS id',
            'e.summary AS summary',
            'e.call_fee AS call_fee',
            'e.description AS description',
            'e.path AS path',
            'e.version AS version',
            'e.original_url AS original_url',
            'e.method AS method',
            'e.sample_request_object AS sample_request_object',
            'e.sample_response_object AS sample_response_object',
            'e.sample_error_object AS sample_error_object',
            'e.service_id AS service_id',
            'e.workspace_id AS workspace_id',
            'e.target_industry AS target_industry',
            'e.target_region AS target_region',
            'e.target_country AS target_country',
            'egm.created_at AS added_at',
            'g.id AS group_id',
            'g.name AS group_name'
            ])
            .where('egm.group_id = :group_id', { group_id })
            .getRawMany();

        return { status: true, message: "Success", data: members };
    }

    // Updates endpoint group
    async updateEndpointGroup(group_id: string, name: string, description: string) {
        await this.endpointGroup.update({ id: group_id }, {
            name: name,
            description: description
        });
        return { status: true, message: "Endpoint group updated successfully", data: {} };
    }

    // Deletes endpoint group
    async deleteGroup(group_id: string) {
        await this.endpointGroup.delete({ id: group_id });
        return { status: true, message: "Group deleted successfully", data: {} };
    }

    // Adds endpoint(s) to group
    async addEndpointsToGroup(endpoint_ids: string[], group_id: string, created_by: string) {
        const members = endpoint_ids.map(endpoint_id => {
            return this.endpointGroupMember.create({
            group_id: group_id,
            endpoint_id: endpoint_id,
            created_by: created_by
            });
        });
        await this.endpointGroupMember.save(members);
        return { status: true, message: "Endpoint added to group successfully", data: {} };
    }

    // Removes endpoint from group
    async removeEndpointFromGroup(endpoint_id: string, group_id: string) {
        await this.endpointGroupMember.delete({ endpoint_id: endpoint_id, group_id: group_id });
        return { status: true, message: "Endpoint removed from group successfully", data: {} };
    }

    // Finds group member by endpoint id and group id
    async findGroupMemberByEndpointIdAndGroupId(endpoint_id: string, group_id: string) {
        const member = await this.endpointGroupMember.findOneBy({ endpoint_id: endpoint_id, group_id: group_id });
        return { status: member ? true : false, message: member ? "Success" : false, data: member };
    }

    // Find groups by endpoint id
    async findGroupsByEndpointId(endpoint_id: string) {
        const groups = await this.endpointGroupMember
            .createQueryBuilder('egm')
            .innerJoinAndSelect(EndpointGroupEntity, 'g', 'g.id = egm.group_id::uuid')
            .select([
            'g.id AS group_id',
            'g.name AS group_name',
            'g.description AS group_description',
            'g.workspace_id AS workspace_id',
            'egm.created_at AS added_at'
            ])
            .where('egm.endpoint_id = :endpoint_id', { endpoint_id })
            .getRawMany();
        return { status: true, message: "Success", data: groups };
    }

    /** END ENDPOINT GROUP */
}
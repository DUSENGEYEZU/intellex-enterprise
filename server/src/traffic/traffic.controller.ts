/**
 * This controller listens to traffic targetting public endpoints
 * and redirects them to the actual private endpoints
 */
import { All, Controller, Get, Param, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ConnectionService } from 'src/connection/connection.service';
import { EndpointService } from 'src/endpoint/services/endpoint/endpoint.service';
import { TrafficService } from './traffic.service';
import { UtilsService } from 'src/utils/services/utils.service';
import { Public } from 'src/authentication/guards/metadata/metadata';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

export enum TrafficStatuses {
    FAILED = 'FAILED',
    BLOCKED = 'BLOCKED',
    PASSED = 'PASSED'
  }


@ApiTags('Traffic control')
@Controller('traffic')
export class TrafficController {
    constructor(
        private endpointService: EndpointService,
        private connectionService: ConnectionService,
        private trafficService: TrafficService,
        private utils: UtilsService,
        private subscriptionService: SubscriptionService
    ){}

    // Handle all types of requests through this single controller method
    @Public()
    @All('pt/:endpoint_id') // Handle GET /pt/:endpoint_id
    @UseInterceptors(AnyFilesInterceptor()) // 'file' is the field name
    async processTrafficRequests(
        @Param('endpoint_id') endpoint_id: string,
        @Req() request: Request,
        @UploadedFiles() files: Express.Multer.File[]
    ){
        return await this.handleTrafficRequest(endpoint_id, request, files);
    }
    // Handle GET /pt/:endpoint_id/*
    @Public()
    @All('pt/:endpoint_id/*')
    @UseInterceptors(AnyFilesInterceptor()) // 'file' is the field name
    async processWildcardTrafficRequests(
        @Param('endpoint_id') endpoint_id: string,
        @Req() request: Request,
        @UploadedFiles() files: Express.Multer.File[]
    ){
        return await this.handleTrafficRequest(endpoint_id, request, files);
    }

    async handleTrafficRequest(endpoint_id: string, request: Request, files?: Express.Multer.File[]){
        let CONSUMER_ID = ""; //Method member
        let PRODUCER_ID = ""; //Method member
        console.log("Incoming traffic:", request.originalUrl, request.body, request.query);
         // Get endpoint details
         const endpoint = await this.endpointService.getEndpointById(endpoint_id);
         if(endpoint){
             // Request api-key or Proceed if endpoint is open
             if(endpoint.is_open === false){
                 // Validate api-key
                 if(request.headers['api-key']){
                     console.log("Verifying api-key...")
                     const api_key_valid = (await this.validateApiKey(request.headers['api-key'])); //-1
                     if(api_key_valid.status === true){
                         CONSUMER_ID = api_key_valid.data.consumer_workspace_id;
                         PRODUCER_ID = api_key_valid.data.producer_workspace_id;
                         console.log("api-key is valid")
                             // The api-key could have either endpoint or group access. We need to verify which one is which.
                             // api-key that starts with 'apk_' is for endpoint access. If it starts with 'gapk', it's for group access
                             const prefix = api_key_valid.data.api_key.substring(0, 4);
                             // If the api-key starts with 'apk_',  it must have access to this service
                             if(prefix === 'apk_'){
                                 console.log("Verifying api-key access level...")
                                 if(endpoint.service_id !== api_key_valid.data.service_id){
                                     this.trafficService.createTraffic(api_key_valid.data.consumer_workspace_id, api_key_valid.data.producer_workspace_id, endpoint.service_id, endpoint.id, TrafficStatuses.BLOCKED, "Access denied. Api-key does not have the right access level");
                                     const response = {status:false, message:"This resource is restricted: api-key does not have the right access level"}
                                     console.log(response)
                                     return response;
                                 }
                             }else if( prefix === 'gapk' ){
                                 // If the api-key starts with 'gapk', the endpoint must have access to this group
                                 // Find this endpoint is member to the group
                                 const groupMember = await this.endpointService.findGroupMemberByEndpointIdAndGroupId(endpoint_id, api_key_valid.data.endpoint_group_id);
                                 if(groupMember.status === false){
                                     this.trafficService.createTraffic(api_key_valid.data.consumer_workspace_id, api_key_valid.data.producer_workspace_id, endpoint.service_id, endpoint.id, TrafficStatuses.BLOCKED, "Access denied - wrong endpoint or wrong group.");
                                     const response = {status: false, message:"Access denied - wrong endpoint or wrong group."}
                                     console.log(response)
                                     return response;
                                 }
                             }

                             // Verify if the consumer has enough balance for applicable APIs (except open API)
                             if(endpoint.is_open == false && endpoint.call_fee !== 0){
                                 const wallet = await this.subscriptionService.getWalletByWorkspaceId(api_key_valid.data.consumer_workspace_id);
                                 if(wallet && wallet.data.balance < endpoint.call_fee){
                                    this.trafficService.createTraffic(api_key_valid.data.consumer_workspace_id, endpoint.workspace_id, endpoint.service_id, endpoint.id, TrafficStatuses.BLOCKED, "Insufficient balance.");
                                     return {status: false, message: "Not enough balance to make this call. Please topup your Wallet to continue."}
                                 }
                             }
                     }else{
                         console.log("Fake api-key")
                         // Record the incident
                         const endpoint = await this.endpointService.getEndpointById(endpoint_id);
                         this.trafficService.createTraffic("", endpoint.workspace_id, endpoint.service_id, endpoint.id, TrafficStatuses.BLOCKED, "Access denied. Fake api-key.");
                         return api_key_valid;
                     }
                 }else{
                     this.trafficService.createTraffic("", endpoint.workspace_id, endpoint.service_id, endpoint.id, TrafficStatuses.BLOCKED, "api-key is required.");
                     const response = {status: false, message:"api-key is required"}
                     console.log(response)
                     return response;
                 }
             }

             // Proceed if none of the above negative conditions were met
             // ...Convert `request.query` to a plain object with string values
             const queryParams = Object.fromEntries(Object.entries(request.query).map(([key, value]) => [key, String(value)]));

             let full_url = "";
             if(endpoint.version === 1){ // Full Masking
                full_url = endpoint.original_url.split('?')[0]+'?'+new URLSearchParams(queryParams).toString();
                console.error('V1: '+full_url, endpoint.version);
             }else{
                // Format according to API version 2 (Partial Masking).
                const originalUrl = new URL(endpoint.original_url);
                const pathSuffix = request.path.split(endpoint.id)[1] || '';
                // Properly construct URL with protocol://hostname:port + path
                const port = originalUrl.port ? `:${originalUrl.port}` : '';
                full_url = `${originalUrl.protocol}//${originalUrl.hostname}${port}${pathSuffix}`;
                // Add query parameters if they exist
                if (Object.keys(queryParams).length > 0) {
                  const urlObj = new URL(full_url);
                  Object.entries(queryParams).forEach(([key, value]) => {
                    urlObj.searchParams.set(key, value);
                  });
                  full_url = urlObj.toString();
                }
                console.error('V2: '+ full_url, endpoint.version);
             }
             try{
                 console.log("Attempting producer API call...", full_url)

                const data = await this.utils.httpRequest(endpoint.method, full_url, request.headers, request.body, files);

                 console.log("Successfully contacted producer API.")
                 this.trafficService.createTraffic('OPEN API', endpoint.workspace_id, endpoint.service_id, endpoint.id, TrafficStatuses.PASSED);
                 // Deduct wallet balance
                 if(endpoint.is_open === false && endpoint.call_fee > 0 && CONSUMER_ID !== ""){
                     console.log("\nDebiting consumer wallet...")
                     this.subscriptionService.debitWallet(CONSUMER_ID, endpoint.call_fee).then(data=>{console.log(data)});
                     this.subscriptionService.createTransaction(CONSUMER_ID, endpoint.call_fee, 'DEBIT')

                     console.log("\nCrediting producer wallet, minus Intellex fees\n")
                     const credit_amount = endpoint.call_fee - (endpoint.call_fee * Number(process.env.INTELLEX_FEE))
                     this.subscriptionService.creditWallet(PRODUCER_ID, credit_amount);
                     this.subscriptionService.createTransaction(PRODUCER_ID, credit_amount, 'CREDIT');
                 }
                 return data;
             }catch(e){
                 console.log("There was an issue contacting produder API.", e)
                 this.trafficService.createTraffic('OPEN API', endpoint.workspace_id, endpoint.service_id, endpoint.id, TrafficStatuses.FAILED, e.toString());
                 const response = {status: false, message: e.toString()}
                 console.log(response)
                 return response;
             }

         }else{
             const response = {status: false, message:"Wrong endpoint"}
             console.log(response)
             return response;
         }
    }

    // Get traffic logs that target the producer workspace
    @Get('logs/prod/ws/:producer_workspace_id/:start_date/:end_date')
    async getTrafficByProducerWorkspace(
        @Param('producer_workspace_id') producer_workspace_id: string,
        @Param('start_date') start_date : string,
        @Param('end_date') end_date: string
    ){
        return this.trafficService.getTrafficByProducerWorkspace(producer_workspace_id, start_date, end_date);
    }

    // Get traffic logs initiated by the consumer workspace
    @Get('logs/cons/ws/:consumer_workspace_id/:start_date/:end_date')
    async getTrafficByConsumerWorkspace(
        @Param('consumer_workspace_id') consumer_workspace_id: string,
        @Param('start_date') start_date : string,
        @Param('end_date') end_date: string
    ){
        return this.trafficService.getTrafficByConsumerWorkspace(consumer_workspace_id, start_date, end_date);
    }

    @Public()
    @Get('/endpoint/:endpoint_id/count')
    async countAllEndpointCalls(@Param('endpoint_id') endpoint_id: string){
        return await this.trafficService.countAllEndpointCalls(endpoint_id);
    }

    @Public()
    @Get('/count')
    async countAllTrafficRecords(){
        return await this.trafficService.countAllTrafficRecords();
    }

    /* Helpers */
    async validateApiKey(api_key){
        const connection = await this.connectionService.getConnectionByApiKey(api_key);
        if(connection){
            return {status:true, message:"API-KEY is valid", data: connection}
        }else{
            return {status: false, message:"Wrong API-KEY"}
        }
    }
}

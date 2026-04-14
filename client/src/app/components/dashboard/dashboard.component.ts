import { Component } from '@angular/core';
import { UtilsService } from '../../services/utils.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  loader = false;
  unit_api_call_price = 0;
  DATES ={ start:"", end:""}
  INBOUND_TRAFFIC = {
    TOTAL: 0,
    PASSED: 0,
    BLOCKED: 0,
    FAILED: 0,
    BILLABLE: 0
  }
  OUTBOUND_TRAFFIC = {
    TOTAL: 0,
    PASSED: 0,
    BLOCKED: 0,
    FAILED: 0,
    BILLABLE: 0
  }
  INBOUND_INTEGRATIONS = {
    TOTAL: 0,
    GRANTED: 0,
    DENIED: 0,
    PENDING: 0
  }
  OUTBOUND_INTEGRATIONS = {
    TOTAL: 0,
    GRANTED: 0,
    DENIED: 0,
    PENDING: 0
  }

  SERVICES_COUNT = 0;
  ENDPOINTS_COUNT = 0;
  PUBLIC_ENDPOINTS = 0;

  SUBSCRIPTION_PLAN = {
    PLAN: '',
    LIMIT: 0, //Default limit for Free/Basic Plan
    CALLS: 0 //Number of calls made this month so far by this subscriber
  }

  constructor(
    private utilsService: UtilsService, 
    private httpClient: HttpClient
  ){
    this.initDates();
    this.unit_api_call_price = this.utilsService.unit_api_call_price;
  }
  
  ngOnInit() {
   this.fetchTimeSeriesAnalytics();
   this.fetchStaticAnalytics();
  }

  fetchTimeSeriesAnalytics(){
    this.getInboundTraffic();
    this.getOutboundTraffic(this.DATES.start, this.DATES.end);
  }
  fetchStaticAnalytics(){
    this.getServicesByWorkspaceId();
    this.getEndpointsByWorkspaceId();
    this.getOutboundIntegrations();
    this.getWorkspacePlan();
    setTimeout(() => {
      this.getInboundIntegrations(); //Call later to avoid concurency conflic
    }, 300);
  }

  getInboundTraffic(){
    this.httpClient.get<{status:boolean, data:[]}>(`${this.utilsService.API_URL}/traffic/logs/prod/ws/${this.utilsService.getMainWorkspace()}/${this.DATES.start}/${this.DATES.end}`).subscribe(data=>{
      this.analyseInboundTraffic(data.data);
    })
  }

  getOutboundTraffic(start_date: string, end_date: string){
    this.httpClient.get<{status:boolean, data:[]}>(`${this.utilsService.API_URL}/traffic/logs/cons/ws/${this.utilsService.getMainWorkspace()}/${start_date}/${end_date}`).subscribe(data=>{
      this.analyseOutboundTraffic(data.data);
    })
  }

  getServicesByWorkspaceId(){
    this.httpClient.get<{status:boolean, data:[]}>(this.utilsService.API_URL + `/service/workspace/${this.utilsService.getMainWorkspace()}`).subscribe(data=>{
      this.SERVICES_COUNT = data.data.length;
    })
  }

  getEndpointsByWorkspaceId(){
    this.loader = true;
    this.httpClient.get<{status:boolean, data:any[]}>(this.utilsService.API_URL + `/endpoint/workspace/${this.utilsService.getMainWorkspace()}`).subscribe(data=>{
      this.loader = false;
      this.ENDPOINTS_COUNT = data.data.length;

      this.PUBLIC_ENDPOINTS = 0; //reset this variable
      data.data.forEach(endpoint => {
        if(endpoint.is_public === true){this.PUBLIC_ENDPOINTS ++}
      })
    })
  }

  getInboundIntegrations(){
    this.httpClient.get<any>(`${this.utilsService.API_URL}/connection/workspace/producer/${this.utilsService.getMainWorkspace()}`).subscribe(data=>{
      this.analyseInboundIntegrations(data.data)
    })
  }

  getOutboundIntegrations(){
    this.httpClient.get<any>(`${this.utilsService.API_URL}/connection/workspace/consumer/${this.utilsService.getMainWorkspace()}`).subscribe(data=>{
      this.analyseOutboundIntegrations(data.data)
    })
  }

  getWorkspacePlan(){
    this.httpClient.get<any>(`${this.utilsService.API_URL}/subscription/plan/workspace/${this.utilsService.getMainWorkspace()}`).subscribe(data=>{
      this.SUBSCRIPTION_PLAN.LIMIT = data.data.package_max_calls;
      this.SUBSCRIPTION_PLAN.PLAN = data.data.package_name;
    })
  }

  

  // HELPERS
  initDates(){
    let d = new Date();
    let YYYY = d.getFullYear();
    let MM = Number(d.getMonth()+1) >= 10 ? Number(d.getMonth()+1) : '0'+Number(d.getMonth()+1);
    let DD = d.getDate() >=10 ? d.getDate() : '0'+d.getDate();
    this.DATES.start = YYYY+'-'+MM+'-01';
    this.DATES.end = YYYY+'-'+MM+'-'+DD;
  }

  analyseInboundTraffic(traffic_data: any[]){
    this.resetInboundTraffic()
    this.INBOUND_TRAFFIC.TOTAL = traffic_data.length;
    traffic_data.forEach(traffic =>{
      if(traffic.t_status === 'BLOCKED'){
        this.INBOUND_TRAFFIC.BLOCKED ++
      }
      if(traffic.t_status === 'PASSED'){
        this.INBOUND_TRAFFIC.PASSED ++
      }
      if(traffic.t_status === 'FAILED'){
        this.INBOUND_TRAFFIC.FAILED ++
      }
    })
  }

  analyseOutboundTraffic(traffic_data: any[]){
    this.SUBSCRIPTION_PLAN.CALLS = traffic_data.length;
    this.resetOutboundTraffic()
    this.OUTBOUND_TRAFFIC.TOTAL = traffic_data.length;
    traffic_data.forEach(traffic =>{
      if(traffic.t_status === 'BLOCKED'){
        this.OUTBOUND_TRAFFIC.BLOCKED ++
      }
      if(traffic.t_status === 'PASSED'){
        this.OUTBOUND_TRAFFIC.PASSED ++
      }
      if(traffic.t_status === 'FAILED'){
        this.OUTBOUND_TRAFFIC.FAILED ++
      }
    })
  }

  analyseInboundIntegrations(integration_data: any[]){
    this.resetInboundIntegrations()
    this.INBOUND_INTEGRATIONS.TOTAL = integration_data.length;
    integration_data.forEach(integration =>{
      if(integration.status === 'GRANTED'){
        this.INBOUND_INTEGRATIONS.GRANTED ++
      }
      if(integration.status === 'DENIED'){
        this.INBOUND_INTEGRATIONS.DENIED ++
      }
      if(integration.status === 'NEW'){
        this.INBOUND_INTEGRATIONS.PENDING ++
      }
    })
  }

  analyseOutboundIntegrations(integration_data: any[]){
    this.resetOutboundIntegrations()
    this.OUTBOUND_INTEGRATIONS.TOTAL = integration_data.length;
    integration_data.forEach(integration =>{
      if(integration.status === 'GRANTED'){
        this.OUTBOUND_INTEGRATIONS.GRANTED ++
      }
      if(integration.status === 'DENIED'){
        this.OUTBOUND_INTEGRATIONS.DENIED ++
      }
      if(integration.status === 'NEW'){
        this.OUTBOUND_INTEGRATIONS.PENDING ++
      }
    })
  }

  resetInboundTraffic(){
    this.INBOUND_TRAFFIC = {
      TOTAL: 0,
      PASSED: 0,
      BLOCKED: 0,
      FAILED: 0,
      BILLABLE: 0
    }
  }
  resetOutboundTraffic(){
    this.OUTBOUND_TRAFFIC = {
      TOTAL: 0,
      PASSED: 0,
      BLOCKED: 0,
      FAILED: 0,
      BILLABLE: 0
    }
  }

  resetOutboundIntegrations(){
    this.OUTBOUND_INTEGRATIONS = {
      TOTAL: 0,
      GRANTED: 0,
      DENIED: 0,
      PENDING: 0
    }
  }
  resetInboundIntegrations(){
    this.INBOUND_INTEGRATIONS = {
      TOTAL: 0,
      GRANTED: 0,
      DENIED: 0,
      PENDING: 0
    }
  }
}

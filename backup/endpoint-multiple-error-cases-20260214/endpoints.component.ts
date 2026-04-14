import { CommonModule, JsonPipe, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { UtilsService } from '../../services/utils.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

declare var $:any;

@Component({
  selector: 'app-endpoints',
  standalone: true,
  imports: [JsonPipe, CommonModule, NgFor, FormsModule, RouterLink],
  templateUrl: './endpoints.component.html',
  styleUrl: './endpoints.component.css'
})

export class EndpointsComponent {
  $:any //Make JQUERY handler availble in this context
  loader = false;
  alert = {success:"", failure:""};
  SERVICES :any = [];
  ENDPOINTS :any = [];
  ORIGINAL_ENDPOINTS_LIST :any = [];

  TARGET = {
    industries: [] as {id:string, name: string}[],
    regions: [] as {id:string, name: string}[],
    countries: [] as {code:string, name: string}[],
    selected: {
      industry: "",
      region: "",
      country: "",
      workspace: {id: "", name:""},
      service: {id: "", name:""}
    }
  }
  
  NEW_SERVICE = { name: "", description: "" };
  NEW_ENDPOINT = {
    id:"",
    method: "GET",
    url: "",
    summary: "",
    description: "",
    sample_response_object: "",
    sample_request_object: "",
    sample_error_object: "",
    service_id: "",
    workspace_id: "",
    target_industry: "",
    target_region: "",
    target_country:"",
    created_by: "",
    call_fee: 0.00,
    version:1,
    params: [] as { key: string, value: string, id: string }[],
    headers: [] as { key: string, value: string, id: string }[],
    multi_part: [] as { key: string, value: string, id: string }[],
  }

  PUBLICATION_SETTING = 'restricted' //by default, API publication is restricted.
  MAIN_WORKSPACE_ID = "";
  SAMPLE_URL_MASK="";
  POST_PAYLOAD_TYPE = 'json'; //default payload type is JSON

  constructor(public utilsService: UtilsService, private httpClient: HttpClient ){
    this.$ = $; //Initialize JQUERY handler
  }

  ngOnInit(){
    this.MAIN_WORKSPACE_ID = this.utilsService.getMainWorkspace() || "";
    // Get list of products for this workspace
    this.getServicesByWorkspaceId(this.MAIN_WORKSPACE_ID)
    this.fetchEndpoints();
  }

  getServicesByWorkspaceId(workspace_id: string){
    this.httpClient.get<any>(this.utilsService.API_URL + `/service/workspace/${workspace_id}`).subscribe(data=>{
      this.SERVICES = data.data;
    })
  }

  fetchEndpoints(){
    this.getEndpointsByWorkspaceId(this.MAIN_WORKSPACE_ID)
  }

  getEndpointsByWorkspaceId(workspace_id: string){
    this.loader = true;
    this.httpClient.get<any>(this.utilsService.API_URL + `/endpoint/workspace/${workspace_id}`).subscribe(data=>{
      this.loader = false;
      this.ENDPOINTS = data.data;
      this.ORIGINAL_ENDPOINTS_LIST = data.data;
    })
  }

  getEndpointsByServiceId(service_id: string){
    if(service_id == '0'){
      this.getEndpointsByWorkspaceId(this.MAIN_WORKSPACE_ID)
    }else{
      this.loader = true;
      this.httpClient.get<any>(this.utilsService.API_URL + `/endpoint/service/${service_id}`).subscribe(data=>{
        this.loader = false;
        this.ENDPOINTS = data.data;
      })
    }
  }

  createService(){
    if(this.NEW_SERVICE.name == ''){
      this.alert.failure = "Please provide the product name";this.alert.success = "";
      console.log(this.alert)
    }else{
      this.loader =  true;
      const payload = {
        service_name: this.NEW_SERVICE.name,
        description: this.NEW_SERVICE.description,
        workspace_id: this.utilsService.getMainWorkspace(),
        created_by: this.utilsService.getSession().id
      }
      this.httpClient.post<any>(this.utilsService.API_URL + '/service/create', payload).subscribe(data=>{
        this.loader = false;
        // Disable the button to avoid double submit
        document.getElementById("submitButton")?.setAttribute('disabled','true');
        this.alert.success = data.status == true ? "Service successfully created" : "Something went wrong. Please try again";this.alert.failure = "";
        this.getServicesByWorkspaceId(this.MAIN_WORKSPACE_ID)
      })
    }
  }

  publishEndpoint(endpoint_id: string){
    this.loader = true;
    this.httpClient.put<any>(this.utilsService.API_URL + '/endpoint/publish/'+endpoint_id+'?access='+this.PUBLICATION_SETTING, {}).subscribe(data=>{
      this.loader = false;
      this.alert.success = "Congrats! The API endpoint is now public!"
      this.NEW_ENDPOINT.id = "" //Clear the endpoint id after use.
      this.getEndpointsByWorkspaceId(this.MAIN_WORKSPACE_ID)
    })
  }

  unpublishEndpoint(endpoint_id: string){
    if(confirm('You are about to unpublish this endpoint. It will no longer be available on the public marketplace. Existing connections will not be affected. If you also wish to revoke access to this endpoint, go to Connections to manage it. Are you sure you want to unpublish this endpoint?')){
      this.loader = true;
      this.httpClient.put<any>(this.utilsService.API_URL + '/endpoint/unpublish/'+endpoint_id, {}).subscribe(data=>{
        this.loader = false;
        this.getEndpointsByWorkspaceId(this.MAIN_WORKSPACE_ID)
      })
    }
  }

  createOrUpdateEndpoint(){
    this.resetAlert()
    if(this.NEW_ENDPOINT.service_id == ''){
      this.alert.failure = "Please specify the product"; this.alert.success = "";
    }else if(this.NEW_ENDPOINT.url == '' || this.NEW_ENDPOINT.url.indexOf('http')==-1){
      this.alert.failure = "Enter a correct URL"; this.alert.success = "";
    }else if(this.NEW_ENDPOINT.summary == ''){
      this.alert.failure = "Endpoint summary is required"; this.alert.success = "";
    }else if(! this.isJSON(this.NEW_ENDPOINT.sample_response_object)){
      this.alert.failure = "Enter a correct JSON format for sample response object"; this.alert.success = "";
    }else if(
      (this.NEW_ENDPOINT.method === 'POST' && this.NEW_ENDPOINT.sample_request_object !== "" && this.NEW_ENDPOINT.multi_part.length === 0 && !this.isJSON(this.NEW_ENDPOINT.sample_request_object)) ||
      !this.isJSON(this.NEW_ENDPOINT.sample_response_object)
    ){
      this.alert.failure = "Enter a correct JSON format for sample request or response object"; this.alert.success = "";
    }else{
      this.loader = true;
      // Disable the button to avoid double submit
      document.getElementById("submitButton")?.setAttribute('disabled','true');
      // Create or edit depending on the presence of .id property
      if(this.NEW_ENDPOINT.id){
        // Update endpoint
        const payload = {
          endpoint_id: this.NEW_ENDPOINT.id,
          summary: this.NEW_ENDPOINT.summary,
          description: this.NEW_ENDPOINT.description,
          endpoint: this.NEW_ENDPOINT.url,
          method: this.NEW_ENDPOINT.method,
          sample_request_object: this.POST_PAYLOAD_TYPE === 'json' ? this.NEW_ENDPOINT.sample_request_object : "",
          sample_response_object: this.NEW_ENDPOINT.sample_response_object,
          sample_error_object: this.NEW_ENDPOINT.sample_error_object,
          service_id: this.NEW_ENDPOINT.service_id,
          target_industry: this.NEW_ENDPOINT.target_industry,
          target_region: this.NEW_ENDPOINT.target_region,
          target_country: this.NEW_ENDPOINT.target_country,
          params: this.NEW_ENDPOINT.params,
          headers: this.NEW_ENDPOINT.headers,
          multi_part: this.POST_PAYLOAD_TYPE === 'multi_part' ? this.NEW_ENDPOINT.multi_part : [],
          call_fee: this.NEW_ENDPOINT.call_fee,
          version: this.NEW_ENDPOINT.version
        }
        
        this.httpClient.patch<any>(this.utilsService.API_URL + '/endpoint/update', payload).subscribe(data=>{
          this.loader = false;
          document.getElementById("submitButton")?.removeAttribute('disabled');
          this.alert.success = data.status == true ? "Endpoint successfully updated" : "Something went wrong. Please try again";this.alert.failure = "";
          $('#dismissModal').click() // Dismiss modal
          this.getEndpointsByWorkspaceId(this.MAIN_WORKSPACE_ID)
        })
      }else{ // Create endpoint
        this.NEW_ENDPOINT.created_by = this.utilsService.getSession().id;
        this.NEW_ENDPOINT.workspace_id = this.MAIN_WORKSPACE_ID;
        
        // Don't sent multi_part if the payload type is JSON
        if(this.POST_PAYLOAD_TYPE === 'json'){
          this.NEW_ENDPOINT.multi_part = [];
        }
        // Don't send sample_request_object if the payload type is multi_part
        if(this.POST_PAYLOAD_TYPE === 'multi_part'){
          this.NEW_ENDPOINT.sample_request_object = "";
        }

        this.httpClient.post<any>(this.utilsService.API_URL + '/endpoint/create', this.NEW_ENDPOINT).subscribe(data=>{
          this.loader = false;
          document.getElementById("submitButton")?.removeAttribute('disabled');
          this.alert.success = data.status == true ? "Endpoint successfully created" : "Something went wrong. Please try again";this.alert.failure = "";
          $('#dismissModal').click() // Dismiss modal
          this.getEndpointsByWorkspaceId(this.MAIN_WORKSPACE_ID)
        })
      }
    }
  }

  deleteEndpoint(endpoint_id: string){
    if(confirm("Are you sure you want to delete this endpoint")){
      this.loader = true;
      this.httpClient.delete<any>(this.utilsService.API_URL + `/endpoint/delete/${endpoint_id}`).subscribe(data=>{
        this.loader = false;
        this.getEndpointsByWorkspaceId(this.MAIN_WORKSPACE_ID);
      })
    }
  }

  isJSON(jsonObject: any){
    try {
      JSON.parse(jsonObject);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get industries
  getTargetIndustries(){
    this.httpClient.get<[]>(this.utilsService.API_URL + '/utils/industries/all').subscribe(data=>{
      this.TARGET.industries = data;
    })
  }
  // Get regions
  getTargetRegions(){
    this.httpClient.get<[]>(this.utilsService.API_URL + '/utils/regions/all').subscribe(data=>{
      this.TARGET.regions = data;
    })
  }
  // Get countries
  getTargetCountries(){
    this.httpClient.get<[]>(this.utilsService.API_URL + '/utils/countries/all').subscribe(data=>{
      this.TARGET.countries = data;
    })
  }
  fetchTargetMarkets(){
    this.getTargetIndustries()
    this.getTargetRegions()
    this.getTargetCountries()
  }

  fetchEndpointParamsAndHeaders(endpoint_id: string){
    // Reset any existing values
    this.NEW_ENDPOINT.params = [];
    this.NEW_ENDPOINT.headers = [];
    this.NEW_ENDPOINT.multi_part = [];

    this.httpClient.get<any>(this.utilsService.API_URL + `/endpoint-params/endpoint/${endpoint_id}`).subscribe(data=>{
      data.data.forEach((entry: { kind: string; key: any; value: any; id: any; }) => {
        if(entry.kind === 'param'){
          this.NEW_ENDPOINT.params.push({key: entry.key, value: entry.value, id: entry.id})
        }
        if(entry.kind === 'header'){
          this.NEW_ENDPOINT.headers.push({key: entry.key, value: entry.value, id: entry.id})
        }

        if(entry.kind === 'multi_part'){
          this.NEW_ENDPOINT.multi_part.push({key: entry.key, value: entry.value, id: entry.id})
        }
      });
      // If the endpoint is a multipart form data, set the payload type to multi_part
      if(this.NEW_ENDPOINT.multi_part.length > 0){
        this.POST_PAYLOAD_TYPE = 'multi_part';
      }else{
        this.POST_PAYLOAD_TYPE = 'json';
      }
    })
  }

  public getServiceName(service_id: string){
    return this.SERVICES[this.SERVICES.findIndex((s: { id: string; }) => s.id === service_id)].name;
  }

  public setEditableEndpoint(endpoint_id: string){
    this.resetAlert();
    let endpoint = this.ENDPOINTS[this.ENDPOINTS.findIndex((e: { id: string; })=> e.id === endpoint_id)];
    this.NEW_ENDPOINT.id = endpoint.id;
    this.NEW_ENDPOINT.url = endpoint.original_url;
    this.NEW_ENDPOINT.method = endpoint.method;
    this.NEW_ENDPOINT.summary = endpoint.summary;
    this.NEW_ENDPOINT.description = endpoint.description;
    this.NEW_ENDPOINT.sample_request_object = endpoint.sample_request_object;
    this.NEW_ENDPOINT.sample_response_object = endpoint.sample_response_object;
    this.NEW_ENDPOINT.sample_error_object = endpoint.sample_error_object;
    this.NEW_ENDPOINT.service_id = endpoint.service_id;
    this.NEW_ENDPOINT.target_industry = endpoint.target_industry;
    this.NEW_ENDPOINT.target_region = endpoint.target_region;
    this.NEW_ENDPOINT.target_country = endpoint.target_country;
    this.NEW_ENDPOINT.call_fee = endpoint.call_fee;
    this.NEW_ENDPOINT.version = endpoint.version;
    console.log(this.NEW_ENDPOINT.version)
    this.setSampleURLMask(endpoint_id)
    this.fetchTargetMarkets()
    this.fetchEndpointParamsAndHeaders(endpoint_id);
  }
  clearEditableEndpoint(){
    this.NEW_ENDPOINT =  {
      id:"",
      method: "GET",
      url: "",
      summary: "",
      description: "",
      sample_response_object: "",
      sample_request_object: "",
      sample_error_object: "",
      service_id: "",
      workspace_id: "",
      target_industry: "",
      target_region: "",
      target_country:"",
      created_by: "",
      call_fee: 0.00,
      version: 1,
      params: [],
      headers: [],
      multi_part: []
    }
    this.resetAlert();
    this.SAMPLE_URL_MASK = "";
  }

  resetAlert(){
    this.alert.failure = ""; this.alert.success = "";
  }

/* End Dynamically add rows */

// Add a new row (query parameter)
addQueryParam() {
  this.NEW_ENDPOINT.params.push({ key: '', value: '', id: ''});
}
// Remove a specific row
removeQueryParam(index: number) {
  this.NEW_ENDPOINT.params.splice(index, 1);
}

// Add a new row (query parameter)
addHeaders() {
  this.NEW_ENDPOINT.headers.push({ key: '', value: '', id: ''});
}
// Remove a specific row
removeHeader(index: number) {
  this.NEW_ENDPOINT.headers.splice(index, 1);
}
/* End Dynamically add rows */

// Add a new row (query parameter)
addMultipartFormData() {
  this.NEW_ENDPOINT.multi_part.push({ key: '', value: '', id: ''});
}
// Remove a specific row
removeMultipartFormData(index: number) {
  this.NEW_ENDPOINT.multi_part.splice(index, 1);
}
/* End Dynamically add rows */

/** FILTERS */
async search(event_target:any){
  let keyword = ""; 
  if(event_target){
    keyword = event_target.value;
  }
  let temp = this.ORIGINAL_ENDPOINTS_LIST;
  this.ENDPOINTS = [];
  await temp.forEach((element: { summary: string, service_name: string, workspace_name: string }, index: string | number)=>{
    if( 
      element.summary.toLowerCase().indexOf(keyword.toLowerCase()) > -1 ||
      element.service_name.toLowerCase().indexOf(keyword.toLowerCase()) > -1 ||
      element.workspace_name.toLowerCase().indexOf(keyword.toLowerCase()) > -1
    ){
      this.ENDPOINTS.push(temp[index]);
    }
  })
}

  toggleEndpointDetails(endpoint_id: string){
    $('#'+endpoint_id).slideToggle('fast');
  }

  setSampleURLMask(endpoint_id?:string){
    const url = new URL(this.NEW_ENDPOINT.url)
    if(Number(this.NEW_ENDPOINT.version) === 1){
      this.SAMPLE_URL_MASK = `https://api.intelex.dev/traffic/pt/${endpoint_id ? endpoint_id : 'AUTO_GENERATED_INTELLEX_ID'}`
    }else{
      this.SAMPLE_URL_MASK = `https://api.intelex.dev/traffic/pt/${endpoint_id ? endpoint_id : 'AUTO_GENERATED_INTELLEX_ID'}`+url.pathname + url.search;
    }
  }
}

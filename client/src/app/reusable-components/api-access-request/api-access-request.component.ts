import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UtilsService } from '../../services/utils.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-api-access-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './api-access-request.component.html',
  styleUrl: './api-access-request.component.css'
})
export class ApiAccessRequestComponent {
  $:any;
  loader:boolean = false;
  SESSION:any;
  is_workspace_connected:boolean = false;
  workspace_connection_status:string = "";
  connection_api_key: string = "";
  alert:{success:string, failure: string} = {success: '', failure: ''}

  @Input() endpoint_id = ""
  @Input() endpoint_group_id = "";
  @Input() service_id = "";
  @Input() workspace_id = "";
  @Input() url = "";
  @Input() method = "";
  @Input() workspace_name = "";
  @Input() service_name = "";
  @Input() summary = "";
  @Input() description = "";
  @Input() industry_id = "";
  @Input() sample_request = "";
  @Input() sample_response = "";
  @Input() purpose = "";

  constructor(
    private utilsService: UtilsService,
    private httpClient: HttpClient,
    private router: Router
  ){
    this.SESSION = this.utilsService.getSession()
  }

  ngOnInit(){
    this.getConnectionStatus(this.endpoint_id, this.endpoint_group_id);
  }
  requestConnection(){
     // Proceed if user is logged in.
     if (this.SESSION) {
      if(this.purpose === ''){
        return alert("Please specify the purpose for which you will use this API")
      }

      let payload = {
        service_id: this.service_id,
        endpoint_id: this.endpoint_id,
        endpoint_group_id: this.endpoint_group_id,
        consumer_workspace_id: this.utilsService.getMainWorkspace(),
        producer_workspace_id: this.workspace_id,
        created_by: this.SESSION.id,
        purpose: this.purpose
      }
      console.log(payload);
      
      this.loader = true;
      this.httpClient.post<any>(`${this.utilsService.API_URL}/connection/request`, payload).subscribe(data => {
        this.loader = false;
        this.resetAlert(); //Reset alert in case there are any previous values
        data.status === true ? this.alert.success = data.message : this.alert.failure = data.message;
        // Reset the purpose for better UX
        this.purpose = ""
      }, error=>{
        this.loader = false;
        this.alert.failure = "Opps! This is on us. Please try again"
      })
    } else {
      this.router.navigateByUrl('/login');
    }
  }

  resetAlert() {
    this.alert = { failure: "", success: "" };
  }

  getConnectionStatus(endpoint_id: string, group_id: string){
    if(this.SESSION){
      let url = endpoint_id ? this.utilsService.API_URL + `/connection/endpoint/${endpoint_id}/workspace/${this.utilsService.getMainWorkspace()}` : this.utilsService.API_URL + `/connection/group/${group_id}/workspace/${this.utilsService.getMainWorkspace()}`
      this.loader = true;
      this.httpClient.get<any>(url).subscribe(data => {
        this.loader = false;
        if(data.data){
          this.workspace_connection_status = data.data.status;
          if(data.data.status === 'NEW'){
            this.is_workspace_connected = true;
          }else if(data.data.status === 'GRANTED'){
            this.is_workspace_connected = true;
            this.connection_api_key = data.data.api_key
          }else{ //DENIED
            this.is_workspace_connected = false;
          }
        }else{
          this.is_workspace_connected = false;
        }
      });
    }
  }
}

import { CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UtilsService } from '../../../services/utils.service';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-connections',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './inbound.component.html',
  styleUrl: './inbound.component.css'
})
export class InboundConnectionsComponent {
  constructor(public utilsService: UtilsService, private httpClient: HttpClient ){}
  loader = false;
  INTERNAL_API_ACCESS :any = []
  GROUP_CONNECTIONS :any = []
  SAMPLE_API_RESPONSE:any = "{}"
  PENDING_REQUESTS = 0;

  ngOnInit(){
    this.fetchConnectionsToEndpoints()
    this.fetchConnectionsToGroups()
  }

  fetchConnectionsToEndpoints(){
    this.loader = true;
    this.httpClient.get<any>(`${this.utilsService.API_URL}/connection/workspace/producer/${this.utilsService.getMainWorkspace()}`).subscribe(data=>{
      this.loader = false;
      this.INTERNAL_API_ACCESS = data.data;

      // Calculate the number of pending requests
      this.PENDING_REQUESTS = 0;
      data.data.forEach((access: { status: string; }) => {
        if(access.status === "NEW") this.PENDING_REQUESTS ++;
      });
    }, error=>{
      this.loader = false;
      alert("Something went wrong trying load endpoint connections. Please try again.")
    })
  }

  fetchConnectionsToGroups(){
    this.httpClient.get<any>(`${this.utilsService.API_URL}/connection/workspace/producer/${this.utilsService.getMainWorkspace()}/groups`).subscribe(data=>{
      this.GROUP_CONNECTIONS = data.data;
    })
  }

  cancelConnection(connection_id: string){
    if(confirm("Are you sure you want to cancel this connection? Connected users will lose access and their api-key will become invalid")){
      this.loader = true;
      this.httpClient.put<any>( `${this.utilsService.API_URL}/connection/cancel/${connection_id}/user/${this.utilsService.getSession().id}`, {}).subscribe(data=>{
        this.loader = false;
        this.fetchConnectionsToEndpoints();
        this.fetchConnectionsToGroups();
      })
    }
  }

  grantConnection(connection_id: string){
    if(confirm("Are you sure you want to grant this connection request?")){
      this.loader = true;
      this.httpClient.put<any>( `${this.utilsService.API_URL}/connection/grant/${connection_id}/user/${this.utilsService.getSession().id}`, {}).subscribe(data=>{
        this.loader = false;
        this.fetchConnectionsToEndpoints();
        this.fetchConnectionsToGroups();
      })
    }
  }
  setSampleResponse(sample_response:any){
    this.SAMPLE_API_RESPONSE = this.utilsService.parseJSON(sample_response);
  }
}

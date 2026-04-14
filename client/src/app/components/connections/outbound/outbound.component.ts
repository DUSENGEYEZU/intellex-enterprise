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
  templateUrl: './outbound.component.html'
})
export class OutboundConnectionsComponent {
  constructor(public utilsService: UtilsService, private httpClient: HttpClient ){}
  loader = false;
  GROUP_CONNECTIONS :any = []
  ENDPOINT_CONNECTIONS :any = []
  PENDING_REQUESTS = 0;

  ngOnInit(){
    this.fetchEndpointConnections()
    this.fetchGroupConnections()
  }

  fetchGroupConnections(){
    this.loader = true;
    this.httpClient.get<any>(`${this.utilsService.API_URL}/connection/workspace/consumer/${this.utilsService.getMainWorkspace()}/groups`).subscribe(data=>{
      this.loader = false;
      this.GROUP_CONNECTIONS = data.data;

      // Calculate the number of pending requests
      this.PENDING_REQUESTS = 0;
      data.data.forEach((access: { status: string; }) => {
        if(access.status === "NEW") this.PENDING_REQUESTS ++;
      });
    })
  }

  fetchEndpointConnections(){
    this.httpClient.get<any>(`${this.utilsService.API_URL}/connection/workspace/consumer/${this.utilsService.getMainWorkspace()}`).subscribe(data=>{
      this.ENDPOINT_CONNECTIONS = data.data;
    })
  }

  cancelConnection(connection_id: string){
    if(confirm("Are you sure you want to cancel this connection? Connected users will lose access and their api-key will become invalid")){
      this.loader = true;
      this.httpClient.put<any>( `${this.utilsService.API_URL}/connection/cancel/${connection_id}/user/${this.utilsService.getSession().id}`, {}).subscribe(data=>{
        this.loader = false;
        this.fetchGroupConnections();
        this.fetchEndpointConnections();
      })
    }
  }

  grantConnection(connection_id: string){
    if(confirm("Are you sure you want to grant this connection request?")){
      this.loader = true;
      this.httpClient.put<any>( `${this.utilsService.API_URL}/connection/grant/${connection_id}/user/${this.utilsService.getSession().id}`, {}).subscribe(data=>{
        this.loader = false;
        this.fetchGroupConnections();
        this.fetchEndpointConnections();
      })
    }
  }
}

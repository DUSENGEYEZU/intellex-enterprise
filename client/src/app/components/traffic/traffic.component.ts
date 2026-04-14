import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { UtilsService } from '../../services/utils.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
declare var $:any

@Component({
  selector: 'app-traffic',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './traffic.component.html',
  styleUrl: './traffic.component.css'
})
export class TrafficComponent {
  loader = false;
  TRAFFIC_DATA :any = []
  DATES ={ start:"", end:""}

  constructor(private httpClient: HttpClient, private utilsService: UtilsService){
    this.initDates();
    this.getProducerTraffic();
  }

  getProducerTraffic(){
    this.loader = true;
    this.httpClient.get<any>(`${this.utilsService.API_URL}/traffic/logs/prod/ws/${this.utilsService.getMainWorkspace()}/${this.DATES.start}/${this.DATES.end}`).subscribe(data=>{
      this.loader = false;
      this.TRAFFIC_DATA = data.data;
      
      this.initDataTables()
    })
  }

  // Helpers
  initDataTables(){
    $("#basic-datatables").dataTable().fnDestroy();
    setTimeout(() => {
      $(document).ready(function () {
        $("#basic-datatables").DataTable({});
      });
    }, 500);
  }
  initDates(){
    let d = new Date();
    let YYYY = d.getFullYear();
    let MM = Number(d.getMonth()+1) >= 10 ? Number(d.getMonth()+1) : '0'+Number(d.getMonth()+1);
    let DD = d.getDate() >=10 ? d.getDate() : '0'+d.getDate();
    this.DATES.start = this.DATES.end = YYYY+'-'+MM+'-'+DD;
  }
}

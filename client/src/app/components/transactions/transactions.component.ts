import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UtilsService } from '../../services/utils.service';
declare var $:any
@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent {
  loader = false;
  DATES ={ start:"", end:""}
  TRANSACTIONS:any = [];
  STATS = {
    TOTAL_REVENUE: 0,
    TOTAL_USAGE: 0
  }

  constructor(
    private http: HttpClient,
    private utilsService: UtilsService
  ){
    this.initDates();
  }

  ngOnInit(){
    this.getTransactions();
  }

  getTransactions(){
    this.loader = true;
    this.http.get<any>(`${this.utilsService.API_URL}/subscription/transactions/workspace/${this.utilsService.getMainWorkspace()}/dates/${this.DATES.start}/${this.DATES.end}`).subscribe(data=>{
      this.loader = false;
      this.TRANSACTIONS = data.data;
      this.computeStats(data.data);
      if(data.data.length > 0){
        this.initDataTables();
      }
    })
  }

  computeStats(transactions:any[]){
    this.STATS.TOTAL_REVENUE = this.STATS.TOTAL_USAGE = 0; // Reset stats
    transactions.forEach(trans=>{
      if(trans.type === 'CREDIT'){
        this.STATS.TOTAL_REVENUE = this.STATS.TOTAL_REVENUE + Math.floor(trans.amount);
      }else{
        this.STATS.TOTAL_USAGE += Math.floor(trans.amount);
      }
    })
  }

  initDates(){
    let d = new Date();
    let YYYY = d.getFullYear();
    let MM = Number(d.getMonth()+1) >= 10 ? Number(d.getMonth()+1) : '0'+Number(d.getMonth()+1);
    let DD = d.getDate() >=10 ? d.getDate() : '0'+d.getDate();
    this.DATES.start = YYYY+'-'+MM+'-01';
    this.DATES.end = YYYY+'-'+MM+'-'+DD;
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
}

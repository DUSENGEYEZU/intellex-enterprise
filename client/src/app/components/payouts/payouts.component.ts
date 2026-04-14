import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { UtilsService } from '../../services/utils.service';
import { FormsModule } from '@angular/forms';
declare var $:any
@Component({
  selector: 'app-payouts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payouts.component.html',
  styleUrl: './payouts.component.css'
})
export class PayoutsComponent {
  loader = false;
  $:any;

  PAYOUT_ACCOUNT :{
    workspace_id: string,
    bank_name: string,
    bank_account_name: string,
    bank_account_number: string,
    swift_code: string,
    country: string,
    created_at: string,
    updated_at: string,
  } = {
    workspace_id: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    swift_code: '',
    country: 'rwanda',
    created_at: '',
    updated_at: ''
  }
  RECENT_PAYOUTS: any [] = [];

  constructor(
    private http: HttpClient,
    private utilsService: UtilsService
  ){
    this.$ = $; //Initialize JQUERY handler
  }

  ngOnInit(){
    this.getPayoutAccount()
  }

  getPayoutAccount(): void {
    this.loader = true;
    this.http.get<any>(`${this.utilsService.API_URL}/subscription/payout/account/workspace/${this.utilsService.getMainWorkspace()}`).subscribe(response => {
      this.loader = false;
      // PAYOUT_ACCOUNT can only be assigned the response if data is not null. If null, it introduces a breaking behavior.
      if(response.data){
        this.PAYOUT_ACCOUNT = response.data;
        // Get payout history
        this.getPayoutHistory();
      }
      //In case of update or create, close the modal only after new changes are loaded
      $('.modal-close').click();
    })
  }

  createOrUpdatePayoutAccount(){
    if(this.PAYOUT_ACCOUNT.bank_name === '' || this.PAYOUT_ACCOUNT.bank_account_number === '' || this.PAYOUT_ACCOUNT.bank_account_name === ''){
      return alert('Fields marked with (*) are mandatory')
    }
    const payload = {
      workspace_id: this.utilsService.getMainWorkspace(),
      bank_name: this.PAYOUT_ACCOUNT.bank_name,
      bank_account_name: this.PAYOUT_ACCOUNT.bank_account_name,
      bank_account_number: this.PAYOUT_ACCOUNT.bank_account_number,
      swift_code: this.PAYOUT_ACCOUNT.swift_code,
      country: this.PAYOUT_ACCOUNT.country
    }
    this.loader = true;
    this.http.post(`${this.utilsService.API_URL}/subscription/payout/account/createorupdate`, payload).subscribe(response => {
      this.loader = false;
      this.getPayoutAccount();
    })
  }

  getPayoutHistory(){
    this.http.get<any>(`${this.utilsService.API_URL}/subscription/payout/history/workspace/${this.utilsService.getMainWorkspace()}?limit=10`).subscribe(response=>{
      this.RECENT_PAYOUTS = response.data;
    })
  }

  saveBankDetails(){
    $('#bank-details-edit').hide();
    $('#bank-details-view').show(); 
  }
}

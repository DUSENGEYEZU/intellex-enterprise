import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UtilsService } from '../../services/utils.service';
import { HttpClient } from '@angular/common/http';

declare var $:any; //JQUERY handler
declare var IremboPay:any; // Relevant script is imported from loadIremboPayScript()
@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.css'
})
export class BillingComponent {
  loader:boolean = false;
  $:any;
  IremboPay:any;
  WALLET_BALANCE: number = 0;
  TOPUP_AMOUNT: number = 5000;
  MINIMUM_TOPUP_AMOUNT:number = 100 //RWF
  RECENT_TOPUP_HISTORY:any = [];

  constructor(
    public utilsService: UtilsService,
    private http: HttpClient
  ){
    this.$ = $; //Initialize JQUERY handler
  }

  ngOnInit(){
    this.loadIremboPayScript();
    this.getWalletBalance();
    this.getRecentTopupInvoices();
  }

  getWalletBalance(){
    this.loader = true;
    this.http.get<{ data: { balance: number } }>(this.utilsService.API_URL+'/subscription/wallet/workspace/'+this.utilsService.getMainWorkspace()).subscribe(data=>{
      this.loader = false;
      this.WALLET_BALANCE = data.data.balance;
    })
  }

  getRecentTopupInvoices() {
    this.http.get<{ data: { invoices: any[] } }>(this.utilsService.API_URL + '/subscription/invoices/workspace/' + this.utilsService.getMainWorkspace() + '?limit=10')
      .subscribe(data => {
        console.log('Last 5 invoices:', data.data);
        this.RECENT_TOPUP_HISTORY = data.data;
      });
  }

  makePayment(){
    // Create invoice
    if(this.TOPUP_AMOUNT < this.MINIMUM_TOPUP_AMOUNT){
      alert('The minumum topup amount is '+this.MINIMUM_TOPUP_AMOUNT)
    }else{
      // Initiate payment process
      let payload = {
        workspace_id: this.utilsService.getMainWorkspace(),
        amount: this.TOPUP_AMOUNT
      }
      this.loader = true;
      this.http.post<{ status: boolean, message: string, data: { invoice_number: string } }>(this.utilsService.API_URL+'/subscription/paymnent/init', payload).subscribe(data=>{
        console.log(data)
        this.loader = false;
        if(data.status === true){
          $('#dissmissModal').click() // Dismiss modal
          this.initIremboPayment(data.data.invoice_number);
        }else{
          alert("Failed to initiate payment: "+data.message);
          $('#dissmissModal').click() // Dismiss modal
        }
      }, error=>{
        this.loader = false;
        console.log(error)
        alert("Failed to initiate payment. Please try again ")
      })
    }
  }

  initIremboPayment(invoice_number: string) {
    IremboPay.initiate({
        publicKey: this.utilsService.irembo_pay_key,
        invoiceNumber: invoice_number,
        locale: IremboPay.locale.EN,
        callback: (err:any, resp:any) => {
            if (!err) {
                // Perform actions on success
                this.getWalletBalance();
                this.getRecentTopupInvoices();
                IremboPay.closeModal();
            } else {
                // Fetch topup history to mark the latest changes.
                this.getRecentTopupInvoices();
            }
        }
    })
}


  loadIremboPayScript(): void {
    const script = document.createElement('script');
    // script.src = 'https://dashboard.sandbox.irembopay.com/assets/payment/inline.js';
    script.src = 'https://dashboard.irembopay.com/assets/payment/inline.js';
    script.async = true;
    script.onload = () => {console.log('Loaded successfully');};
    script.onerror = (error) => {console.error('Script loading error: ', error);};
    document.body.appendChild(script);
  }
}

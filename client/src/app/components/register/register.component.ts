import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  loader = false;
  success = false;
  alert = "";

  SUBSCRIPTION_PACKAGE: string;
  
  FULL_NAME = "";
  EMAIL = "";
  BUSINESS_NAME = "";
  INDUSTRY = "";
  PASSWORD = "";

  INDUSTRIES: {id: string, name: string}[] = [];

  constructor(
    private utilsService: UtilsService, 
    private httpClient: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ){
    
    this.SUBSCRIPTION_PACKAGE = this.route.snapshot.queryParamMap.get('package') || "";
  }

  ngOnInit() {
    // Redirect to analytics when session is present
    if(this.utilsService.getSession()){
      this.router.navigateByUrl('/analytics')
    }else{
      console.log("Redirecting... to packages page", this.SUBSCRIPTION_PACKAGE)
      // this.managePlanSelection(this.SUBSCRIPTION_PACKAGE);
    }

    // Gets list of industries
    this.getIndustries();
  }

  register(){
    // Check if all required fields have been filled
    if(this.BUSINESS_NAME == ''){
      this.alert = "A business name is mandatory"
    }else if(this.FULL_NAME == ''){
      this.alert = "Firstname is mandatory";
    }else if(this.EMAIL == '' || this.EMAIL.indexOf('@') == -1 ||  this.EMAIL.indexOf('.') == -1){
      this.alert = "Please enter a correct email"
    }else if(this.PASSWORD == ''){
      this.alert = "Please set a password"
    }else{
      // Disable the button to avoid double submit
      document.getElementById("registerButton")?.setAttribute('disabled','true');
      // construct the body
      let name = this.FULL_NAME.trim().split(' ');
      const payload = {
        first_name: name[0],
        last_name: name.slice(1).join(" "),
        email: this.EMAIL,
        password: this.PASSWORD,
        role: 'ADMIN',
      }
      this.loader = true;
      this.httpClient.post<any>(this.utilsService.API_URL + '/user', payload).subscribe(data=>{
        this.loader = false;
        // If account creation was successful, proceed to creating the workspace
        console.log(data)
        if(data.status === true && data.data.id){
          this.httpClient.post<any>(this.utilsService.API_URL + '/workspace/create', {name: this.BUSINESS_NAME, industry_id: "", creator_user_id: data.data.id}).subscribe(data=>{
            if(data.status === true){
              this.success = true;
            }else{
              this.alert = "Something went wrong while creating your workspace. Please try again"
            }
          })
        }else{
          document.getElementById("registerButton")?.removeAttribute('disabled');
          this.alert = data.message;
        }
      });
    }
  }

   // Get industries
   getIndustries(){
    this.httpClient.get<[{id: string, name: string}]>(this.utilsService.API_URL + '/utils/industries/all').subscribe(data=>{
      this.INDUSTRIES = data;
        this.INDUSTRY = data ? data[0].id : "";
    })
  }

  managePlanSelection(package_name: string){
    // Redirect to package selection if no package is specified
    if(package_name === ''){
      window.location.href = ('https://intellex.dev/#pricing');
    }else{
      // Verify if package is legitimate
      this.httpClient.get<{status: boolean}>(this.utilsService.API_URL + `/subscription/package/verify/name/${package_name}`).subscribe(results=>{
        if(results.status !== true){
          window.location.href = ('https://intellex.dev/#pricing');
        }
      }, error=>{
        console.log(error);
        window.location.href = ('https://intellex.dev/#pricing');
      })
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private utilsService: UtilsService, private httpClient: HttpClient, private router: Router){}

  loader = false;
  success = false;
  alert = "";

  USERNAME = "";
  PASSWORD = "";

  ngOnInit() {
    if(this.utilsService.getSession()){
      this.router.navigate(['/marketplace', {}]);
    }
  }

  login(){
    if(this.USERNAME === ''){
      this.alert = "Please enter your username"
    }else if(this.PASSWORD === ''){
      this.alert = "Please enter your password";
    }else{
      // Disable the button to avoid double submit
      document.getElementById("loginButton")?.setAttribute('disabled','true');
      this.loader = true; this.alert = "";
      this.httpClient.post<any>(this.utilsService.API_URL+'/auth/login', {username: this.USERNAME, password: this.PASSWORD}).subscribe(data=>{
        if(data.status === true){
          const user = data.data;
          const token = data.token;
          // Get user workspaces
          this.httpClient.get<any>(this.utilsService.API_URL+'/workspace/user/'+user.id, {headers:{'Authorization': 'Bearer '+token}}).subscribe(data=>{
            this.loader = false;
            if(data.data && data.data.length > 0){
              let workspaces:any = [];
              data.data.forEach((ws: { workspace_id: any; workspace_name: any; }) => {
                workspaces.push({workspace_id: ws.workspace_id, workspace_name: ws.workspace_name})
              });
              this.utilsService.createSession(user.id, user.firstName, user.lastName, token, workspaces);
              // Redirect to dashboard by reloading for session settings to take effect
              setTimeout(() => {
                this.utilsService.reloadPage()
              }, 3);
            }else{
              this.loader = false;
              this.alert = data.message
              document.getElementById("loginButton")?.removeAttribute('disabled');
            }
          })
        }else{
          this.loader = false;
          this.alert = data.message;
          document.getElementById("loginButton")?.removeAttribute('disabled');
        }
      })
    }
  }

}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  authService= inject(AuthService);
  router = inject(Router);
  toastService = inject(ToastService);
  route= inject(ActivatedRoute);

  loader = false;
  alert = "";
  username = "";
  password="";
  confirmPassword="";

  otp: string | null = null;
  otpUsername: string | null = null;

  forgotPasswordOnSubmit(){

    if(this.username === ''){
      this.alert = "Please enter your username"
    }

    document.getElementById("loginButton")?.setAttribute('disabled','true');
    this.loader = true; this.alert = "";

    this.authService.forgotPassword(this.username).subscribe({
    next: (response) => {
        //success
        this.loader = false;
        this.toastService.showSuccess(response.message);
        document.getElementById("loginButton")?.removeAttribute('disabled');
        this.router.navigate(['/login']);
    },
    error: (error) => {
        //error
        this.loader = false;
        this.alert = error.error.message
        document.getElementById("loginButton")?.removeAttribute('disabled');
      },
    });
  }

  resetPasswordOnSubmit(){
    if(this.password === ''){
      this.alert = "Please enter the new password"
      return;
    }

    if(this.confirmPassword!==this.password){
      this.alert = "Passwords do not match. Please try again."
       return;
    }

    document.getElementById("loginButton")?.setAttribute('disabled','true');
    this.loader = true; this.alert = "";
    this.router.navigate(['/login']);
    this.authService.resetPassword(this.otpUsername ?? "", this.otp ?? "", this.password).subscribe({
    next: (response) => {
        //success
        this.loader = false;
        this.toastService.showSuccess(response.message);
        document.getElementById("loginButton")?.removeAttribute('disabled');
    },
    error: (error) => {
        //error
        this.loader = false;
        this.alert = error.error.message
        document.getElementById("loginButton")?.removeAttribute('disabled');
      },
    });
  }

   ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.otp = params['otp'] || null;
      this.otpUsername = params['otpUsername'] || null;
    });
  }
}

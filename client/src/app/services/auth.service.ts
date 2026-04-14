import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

   http = inject(HttpClient);
   utilsService = inject(UtilsService);


  forgotPassword(email: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const body = JSON.stringify({ email: email });
    return this.http.post(`${this.utilsService.API_URL}/auth/forgot-password`, body, { headers });
  }

  resetPassword(otpUsername: string, otp: string, password: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const body = JSON.stringify({
        email:otpUsername,
        otp:otp,
        password:password
    });

    return this.http.post(`${this.utilsService.API_URL}/auth/reset-password`, body, { headers });
  }
}

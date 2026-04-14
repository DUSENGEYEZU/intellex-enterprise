import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, Observable, throwError } from "rxjs";
import { UtilsService } from "./services/utils.service";


export function httpInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  console.log(req.url);
   // Retrieve the JWT token
   const utilsService = inject(UtilsService);
   const session = utilsService.getSession();
   let token = ""
   if(session){
    token = session.token
   }
   // If a token exists, clone the request and add the Authorization header
   if (token) {
     const clonedRequest = req.clone({
       setHeaders: {
         Authorization: `Bearer ${token}`,
       },
     });
     return next(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Handle unauthorized errors (token might have expired)
          // utilsService.destroySession();

          // Inject the Router and navigate to /login
          // const router = inject(Router); // Use inject() to get an instance of Router
          // router.navigate(['/login']);
        }
        console.log(error)
        return throwError(() => new Error('Something went wrong'));
      })
     );
   }

   // If no token, just proceed with the original request
  return next(req);
}
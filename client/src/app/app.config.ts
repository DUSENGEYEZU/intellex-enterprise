import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpInterceptor } from './auth.interceptor';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations} from '@angular/platform-browser/animations';
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpInterceptor]),),
    provideToastr({
      timeOut: 0,
      positionClass: 'toast-top-center',
      progressBar: false,
      closeButton: true,
      tapToDismiss: false,
      newestOnTop: true
    }),
    provideAnimations(),

  ]
};

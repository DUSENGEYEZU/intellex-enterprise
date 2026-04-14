import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, WritableSignal } from '@angular/core';
import { UtilsService } from './utils.service';
import { Observable } from 'rxjs';
import { Endpoint } from '../types/api-test-bench';



@Injectable({
  providedIn: 'root'
})
export class ApiTestBenchService {

     http = inject(HttpClient);
     utilsService = inject(UtilsService);

      submitApiTestRequest(endpointData: WritableSignal<Endpoint>) : Observable<any> {

        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
        });


        if (endpointData().body_type === 'formData' && endpointData().multi_part.length>0) {
            const formData = new FormData();
            // Include core metadata
            formData.append('meta', new Blob([JSON.stringify({
              ...endpointData,
              multi_part: undefined, // exclude files from JSON blob
            })], { type: 'application/json' }));

            // Add multipart (attachments)
            endpointData().multi_part.forEach((item: any) => {
              if (item.value instanceof File) {
                formData.append(item.key, item.value); // file
              } else {
                formData.append(item.key, item.value); // string
              }
            });
            return this.http.post(`${this.utilsService.API_URL}/forward-request/submit`, formData);
        }

        console.log("post data",endpointData());

        // Fallback for regular JSON
        return this.http.post(`${this.utilsService.API_URL}/forward-request/submit`, endpointData());

      }
}

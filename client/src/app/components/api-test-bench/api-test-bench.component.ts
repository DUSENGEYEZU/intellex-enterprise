import { Component, computed, EventEmitter, inject, Inject, input, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from '../editor/editor.component';
import {Endpoint, FormDataItem } from '../../types/api-test-bench'
import { ApiTestBenchService } from '../../services/api-test-bench.service';


@Component({
  standalone: true,
  selector: 'app-api-test-bench',
  templateUrl: './api-test-bench.component.html',
  styleUrl: './api-test-bench.component.css',
  imports: [CommonModule, FormsModule,  EditorComponent]
})
export class ApiTestBenchComponent implements OnChanges {
  apiTestBenchService = inject(ApiTestBenchService);
  endpoint = input<any>();
  @Output() endpointChange = new EventEmitter<any>();
  params = input<{key: string, value: string, id: string}[]>([]);
  headers = input<{key: string, value: string, id: string}[]>([]);
  multipart = input<{key: string, value: string, id: string}[]>([]);
  isUrlEditable = input<boolean>();

  loader= signal<boolean>(false);
  method = signal<string>('');
  selectedMethod = "";

  methods = signal([
  { label: 'GET', value: 'GET', icon: 'fa fa-chevron-down' },
  { label: 'POST', value: 'POST', icon: 'fa fa-caret-down' },
  { label: 'PUT', value: 'PUT', icon: 'fa fa-caret-down' },
  { label: 'DELETE', value: 'DELETE', icon: 'fa fa-caret-down' },
  { label: 'PATCH', value: 'PATCH', icon: 'fa fa-caret-down' },
  { label: 'OPTIONS', value: 'OPTIONS', icon: 'fa fa-caret-down' },
 ]);

  requestTabs = ['Params', 'Headers', 'Body'];
  selectedRequestTab = signal(this.requestTabs[0]);

  responseTabs = ['Body'];
  selectedResponseTab = signal(this.responseTabs[0]);

  changeMethod(newMethod: string) {
    this.method.set(newMethod);
  }

  selectRequestTab(tab: string) {
    this.selectedRequestTab.set(tab);
  }

  selectResponseTab(tab: string) {
    this.selectedResponseTab.set(tab);
  }

  isRequestTabActive(tab: string): boolean {
    return this.selectedRequestTab() === tab;
  }

  isResponseTabActive(tab: string): boolean {
    return this.selectedResponseTab() === tab;
  }

  NEW_ENDPOINT = signal<Endpoint>({
        id: "",
        method: "",
        url: "",
        summary: "",
        description: "",
        sample_response_object: "",
        sample_request_object: "",
        sample_error_object: "",
        service_id: "",
        workspace_id: "",
        target_industry: "",
        target_region: "",
        target_country: "",
        created_by: "",
        call_fee: 0.0,
        version: 1,
        params: [],
        headers: [],
        multi_part: [],
        form_data: [],
        body_type: ""
  });

  bodyType= 'json'

  //form data
  // Called when the radio button is changed
  onBodyTypeChange(type: string) {

    this.NEW_ENDPOINT.update(endpoint=>({...endpoint, body_type: type}))
    // Reset or handle the data accordingly when switching body type
  }
 // Add a new key-value param row for form data

  addNewFormParam() {
    this.NEW_ENDPOINT.update(endpoint => ({
      ...endpoint,
      form_data: [
        ...endpoint.form_data,
        { key: '', value: '', id: '', valueType: 'text' }
      ]
    }));
  }

  // Remove a param row

  removeQueryFormParam(index: number) {
    this.NEW_ENDPOINT.update(endpoint => ({
      ...endpoint,
      form_data: endpoint.form_data.filter((_, i) => i !== index)
    }));
  }


get formData() {
  return this.NEW_ENDPOINT().form_data;
}
onFileChange(event: any, index: number): void {
  const input = event.target as HTMLInputElement;
  const file =  event.target.files[0];
console.log(file)
  if (file) {
    this.NEW_ENDPOINT.update(endpoint => {
      const updatedFormData = [...endpoint.form_data];
      updatedFormData[index] = { ...updatedFormData[index], value: file };
      return { ...endpoint, form_data: updatedFormData };
    });
  }
}

  //end of form data

  addQueryParam() {
    this.NEW_ENDPOINT.update(endpoint => ({
      ...endpoint,
      params: [...endpoint.params, { key: '', value: '', id: '' }]
    }));
  }
  // Remove a specific row

removeHeader(index: number) {
  this.NEW_ENDPOINT.update(endpoint => ({
    ...endpoint,
    headers: endpoint.headers.filter((_, i) => i !== index)
  }));
}

  removeQueryParam(index: number) {
    this.NEW_ENDPOINT.update(endpoint => ({
      ...endpoint,
      params: endpoint.params.filter((_, i) => i !== index)
    }));
  }

  addHeaders() {
    this.NEW_ENDPOINT.update(endpoint => ({
      ...endpoint,
      headers: [...endpoint.headers, { key: '', value: '', id: '' }]
    }));
  }

requestJson = signal("");
responseJson = signal("");

sendApiTestRequest(){
this.loader.set(true);
  this.apiTestBenchService.submitApiTestRequest(this.NEW_ENDPOINT).subscribe({
    next: (res) => {
       this.loader.set(false);
     this.NEW_ENDPOINT.update(endpoint=>(
        {...endpoint,sample_response_object:JSON.stringify(res.data, null, 2)}))
    },
    error: (err) => {
      this.loader.set(false);
      let errorResponse = {
        statusCode: err.statusCode,
        message: err.message
      }

      this.NEW_ENDPOINT.update(endpoint=>(
        {...endpoint,sample_response_object:JSON.stringify(errorResponse, null, 2)}))
    }
  });
}

  ngOnChanges(changes: SimpleChanges): void {
      //update the method
      this.changeMethod(this.endpoint().method);
      this.NEW_ENDPOINT.update(endpoint=>(
        {...endpoint,
          method: this.endpoint().method,
          url: this.endpoint().url,
          sample_response_object: this.endpoint().sample_response_object,
          params: this.params().map(p => ({ ...p })),
          headers: this.headers().map(p => ({ ...p })),
          body_type: 'json'
        }))
  }

  onUrlInputChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value;
    this.NEW_ENDPOINT.update(endpoint => ({
      ...endpoint,
      url: newValue
    }));
    this.endpointChange.emit(newValue); // Emit the new value to the parent component
    this.endpointChange.emit(this.NEW_ENDPOINT()); // Emit the updated endpoint object
    // Update the endpoint URL or handle the input change logic here
    console.log('Input changed to:', newValue);
  }

}

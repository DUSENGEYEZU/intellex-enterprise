import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { UtilsService } from '../../../services/utils.service';
import { CommonModule, JsonPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { ApiTestBenchComponent } from '../../api-test-bench/api-test-bench.component';

declare var $: any

/** Error case as returned by API / docs (extends legacy two-field shape) */
export type EndpointErrorCaseDoc = {
  case_title: string;
  sample_error_object: string;
  request_payload_type?: 'json' | 'multi_part';
  sample_request_object?: string | Record<string, unknown>;
  multi_part?: { key: string; value: string }[];
};

@Component({
  selector: 'app-endpoint',
  standalone: true,
  imports: [RouterLink, TitleCasePipe, JsonPipe, FormsModule, CommonModule, ApiTestBenchComponent],
  templateUrl: './endpoint.component.html',
  styleUrl: './endpoint.component.css'
})
export class EndpointComponent implements OnInit, OnDestroy {
  SESSION: any = null;
  MAIN_WORKSPACE;

  ENDPOINT_ID :any = '';
  PAGE_TITLE :any = '';
  REFERER :any = '';
  /** Public catalog group id (query `group`) — when set with referer marketplace/group, sidebar lists sibling APIs */
  catalogGroupId = '';

  STATS = {
    traffic_count: 0,
    connections_count: 0,
    is_workspace_connected: false,
    workspace_connection_status: '',
    connection_api_key: ''
  }

  endpoint :any = {};
  params : {key: string, value: string, id: string}[] = [];
  headers : {key: string, value: string, id: string}[] = [];
  multipart : {key: string, value: string, id: string}[] = [];

  loader = false;
  /** Loads endpoint docs without hiding the whole page when browsing a published catalog */
  detailLoader = false;
  catalogSidebarLoader = false;
  catalogGroupName = '';
  catalogMembers: { id: string; method?: string; summary?: string }[] = [];
  private lastFetchedCatalogGroupId = '';
  private routeSub?: Subscription;
  alert = { failure: "", success: "Well done" };
  $:any //Make JQUERY handler availble in this context

  REQUESTED_ENDPOINT = { id: "", service_id: "", workspace_id: "", url: "", method: "", worspace_name: "", service_name: "", summary: "", description: "", industry_id: "", sample_request: "", sample_response: "", sample_error: "", purpose: "" };
  API_GROUPS: any [] = []

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private httpClient: HttpClient,
    public utilsService: UtilsService,
    private toast: ToastService
  ){


    if (this.utilsService.getSession()) {
      this.SESSION = this.utilsService.getSession();
      this.MAIN_WORKSPACE = this.utilsService.getMainWorkspace();
    }

    this.$ = $; //Initialize JQUERY handler
  }

  ngOnInit() {
    this.routeSub = this.route.queryParamMap.subscribe((q) => this.applyQueryParams(q));
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  /** Browsing docs opened from a shared public API group catalog */
  get showGroupCatalogNav(): boolean {
    return !!this.catalogGroupId && this.REFERER === 'marketplace/group';
  }

  private applyQueryParams(q: ParamMap) {
    this.ENDPOINT_ID = q.get('id') || '';
    this.PAGE_TITLE = q.get('title') || '';
    this.REFERER = q.get('referer') || '';
    this.catalogGroupId = q.get('group') || '';
    this.titleService.setTitle(`Intellex | ${this.PAGE_TITLE || 'Endpoint'}`);

    if (this.showGroupCatalogNav) {
      this.loadCatalogSidebar(this.catalogGroupId);
    } else {
      this.lastFetchedCatalogGroupId = '';
      this.catalogMembers = [];
      this.catalogGroupName = '';
      this.catalogSidebarLoader = false;
    }

    if (this.ENDPOINT_ID) {
      this.fetchEndpointDetails();
      this.fetchEndpointConnections();
      this.fetchEndpointTrafficCount();
      if (this.SESSION) {
        this.getConnectionStatus();
      }
    } else {
      this.endpoint = {};
      this.detailLoader = false;
      this.loader = false;
    }
    if (this.SESSION) {
      this.getAPIGroups();
    }
  }

  loadCatalogSidebar(groupId: string) {
    if (groupId === this.lastFetchedCatalogGroupId && this.catalogMembers.length > 0) {
      return;
    }
    this.lastFetchedCatalogGroupId = groupId;
    this.catalogSidebarLoader = true;
    this.httpClient.get<any>(`${this.utilsService.API_URL}/endpoint/group/public/${groupId}`).subscribe({
      next: (res) => {
        this.catalogSidebarLoader = false;
        if (!res?.status || !res.data) {
          this.catalogMembers = [];
          this.catalogGroupName = '';
          return;
        }
        this.catalogGroupName = res.data.group?.name || '';
        this.catalogMembers = (res.data.members || []) as { id: string; method?: string; summary?: string }[];
      },
      error: () => {
        this.catalogSidebarLoader = false;
        this.catalogMembers = [];
        this.catalogGroupName = '';
      },
    });
  }

  catalogEndpointLinkQueryParams(member: { id: string; summary?: string }) {
    return {
      id: member.id,
      title: member.summary || 'API',
      referer: 'marketplace/group',
      group: this.catalogGroupId,
    };
  }

  isCatalogMemberActive(memberId: string): boolean {
    return memberId === this.ENDPOINT_ID;
  }

  getEndpointErrorCases(endpoint: any): EndpointErrorCaseDoc[] {
    let raw = endpoint?.error_cases;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        raw = null;
      }
    }
    if (raw && Array.isArray(raw) && raw.length > 0) {
      return raw as EndpointErrorCaseDoc[];
    }
    if (endpoint?.sample_error_object) {
      return [{ case_title: 'Error response', sample_error_object: endpoint.sample_error_object }];
    }
    return [];
  }

  get documentedQueryParams(): { key: string; value: string; id: string }[] {
    return this.params.filter((p) => (p.key || '').trim() !== '');
  }

  get documentedHeaders(): { key: string; value: string; id: string }[] {
    return this.headers.filter((h) => (h.key || '').trim() !== '');
  }

  /** Form-Data rows with at least one non-empty key */
  marketplaceMultipartDocumented(): boolean {
    return (
      Array.isArray(this.multipart) && this.multipart.some((r) => (r?.key || '').trim() !== '')
    );
  }

  /** JSON sample body documented (API may return a string or an already-parsed object/array) */
  marketplaceJsonSampleDocumented(): boolean {
    const v = this.endpoint?.sample_request_object;
    if (v == null || v === '') {
      return false;
    }
    if (typeof v === 'string') {
      return v.trim() !== '';
    }
    // Arrays use numeric keys — Object.keys([]).length is 0; still valid JSON samples
    if (typeof v === 'object' && v !== null) {
      return true;
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
      return true;
    }
    return false;
  }

  /** Any success-path sample request content to show */
  marketplaceHasSampleRequest(): boolean {
    return this.marketplaceMultipartDocumented() || this.marketplaceJsonSampleDocumented();
  }

  /** Safe value for `| json` in the template (handles string or parsed JSON from API) */
  marketplaceSampleRequestJson(): unknown {
    const v = this.endpoint?.sample_request_object;
    if (v == null || v === '') {
      return {};
    }
    if (typeof v !== 'string') {
      return v;
    }
    try {
      return JSON.parse(v as string);
    } catch {
      return v;
    }
  }

  errorCaseHasMultipartSampleRequest(errCase: EndpointErrorCaseDoc): boolean {
    return (
      Array.isArray(errCase?.multi_part) &&
      !!errCase.multi_part?.some((m) => (m?.key || '').trim() !== '')
    );
  }

  errorCaseHasJsonSampleRequest(errCase: EndpointErrorCaseDoc): boolean {
    if (this.errorCaseHasMultipartSampleRequest(errCase)) {
      return false;
    }
    const v = errCase?.sample_request_object;
    if (v == null || v === '') {
      return false;
    }
    if (typeof v === 'string') {
      return v.trim() !== '';
    }
    if (typeof v === 'object' && v !== null) {
      return true;
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
      return true;
    }
    return false;
  }

  errorCaseSampleRequestData(errCase: EndpointErrorCaseDoc): unknown {
    const v = errCase?.sample_request_object;
    if (v == null || v === '') {
      return {};
    }
    if (typeof v === 'object') {
      return v;
    }
    try {
      return JSON.parse(v as string);
    } catch {
      return {};
    }
  }

  errorCaseHasSampleRequest(errCase: EndpointErrorCaseDoc): boolean {
    return this.errorCaseHasJsonSampleRequest(errCase) || this.errorCaseHasMultipartSampleRequest(errCase);
  }

  fetchEndpointDetails(){
    // Public details only: requires endpoint to be published; never exposes original_url (see server toPublicEndpoints strict).
    const url = `${this.utilsService.API_URL}/endpoint/details/${this.ENDPOINT_ID}`;

    this.endpoint = {};
    if (this.showGroupCatalogNav) {
      this.detailLoader = true;
    } else {
      this.loader = true;
    }
    this.params = [];
    this.headers = [];
    this.multipart = [];
    this.httpClient.get<any>(url).subscribe({
      next: (data) => {
        this.detailLoader = false;
        this.loader = false;
        if (!data?.status || !data.data?.endpoint) {
          this.endpoint = {};
          return;
        }
        this.endpoint = data.data.endpoint;
        const rows = data.data.params || [];
        rows.forEach((entry: { kind: string; key: string; value: string; id: string }) => {
          if (entry.kind === 'param') {
            this.params.push({ key: entry.key, value: entry.value, id: entry.id });
          }
          if (entry.kind === 'header') {
            this.headers.push({ key: entry.key, value: entry.value, id: entry.id });
          }
          if (entry.kind === 'multi_part') {
            this.multipart.push({ key: entry.key, value: entry.value, id: entry.id });
          }
        });
      },
      error: () => {
        this.detailLoader = false;
        this.loader = false;
        this.endpoint = {};
      },
    });
  }

  fetchEndpointTrafficCount(){
    this.httpClient.get<any>(this.utilsService.API_URL + `/traffic/endpoint/${this.ENDPOINT_ID}/count`).subscribe(data => {
      this.STATS.traffic_count = data.data;
    });
  }

  fetchEndpointConnections(){
    this.httpClient.get<any>(this.utilsService.API_URL + `/connection/endpoint/${this.ENDPOINT_ID}/count`).subscribe(data => {
      this.STATS.connections_count = data.data;
    });
  }

  getConnectionStatus(){
    if(this.SESSION){
      this.httpClient.get<any>(this.utilsService.API_URL + `/connection/endpoint/${this.ENDPOINT_ID}/workspace/${this.MAIN_WORKSPACE}`).subscribe(data => {
        if(data.data){
          this.STATS.workspace_connection_status = data.data.status;
          if(data.data.status === 'NEW'){
            this.STATS.is_workspace_connected = true;
          }else if(data.data.status === 'GRANTED'){
            this.STATS.is_workspace_connected = true;
            this.STATS.connection_api_key = data.data.api_key;
          }else{ //DENIED
            this.STATS.is_workspace_connected = false;
          }
        }else{
          this.STATS.is_workspace_connected = false;
        }
      });
    }
  }

  // Gets a list of API Groups that this endpoint belongs to
  getAPIGroups(){
    if (!this.ENDPOINT_ID) {
      this.API_GROUPS = [];
      return;
    }
    this.httpClient.get<any>(this.utilsService.API_URL + `/endpoint/groups/endpoint/${this.ENDPOINT_ID}`).subscribe((data) => {
      this.API_GROUPS = data.data;
    });
  }

  setRequestedEndpoint(endpoint_id: string, service_id: string, workspace_id: string, url: string, method: string,sample_request: string, sample_response: string, workspace_name: string, service_name: string, industry_id: string, description: string, summary: string) {
    // Reset alert
    this.resetAlert()
    this.REQUESTED_ENDPOINT.id = endpoint_id;
    this.REQUESTED_ENDPOINT.service_id = service_id;
    this.REQUESTED_ENDPOINT.workspace_id = workspace_id;
    this.REQUESTED_ENDPOINT.worspace_name = workspace_name;
    this.REQUESTED_ENDPOINT.service_name = service_name;
    this.REQUESTED_ENDPOINT.url = url;
    this.REQUESTED_ENDPOINT.method = method;
    this.REQUESTED_ENDPOINT.summary = summary;
    this.REQUESTED_ENDPOINT.industry_id = industry_id;
    this.REQUESTED_ENDPOINT.description = description;
    this.REQUESTED_ENDPOINT.sample_request = this.utilsService.parseJSON(sample_request);
    this.REQUESTED_ENDPOINT.sample_response = this.utilsService.parseJSON(sample_response);
  }

  requestConnection() {
    // Proceed if user is logged in.
    if (this.SESSION) {
      if(this.REQUESTED_ENDPOINT.purpose === ''){
        return alert("Please specify the purpose for which you will use this API")
      }

      let payload = {
        service_id: this.REQUESTED_ENDPOINT.service_id,
        endpoint_id: this.REQUESTED_ENDPOINT.id,
        consumer_workspace_id: this.utilsService.getMainWorkspace(),
        producer_workspace_id: this.REQUESTED_ENDPOINT.workspace_id,
        created_by: this.SESSION.id,
        purpose: this.REQUESTED_ENDPOINT.purpose
      }
      this.loader = true;
      this.httpClient.post<any>(`${this.utilsService.API_URL}/connection/request`, payload).subscribe(data => {
        this.loader = false;
        this.resetAlert(); //Reset alert in case there are any previous values
        data.status === true ? this.alert.success = data.message : this.alert.failure = data.message;
        this.getConnectionStatus();
        // Reset the purpose for better UX
        this.REQUESTED_ENDPOINT.purpose = ""
      }, error=>{
        this.loader = false;
        this.alert.failure = "Opps! This is on us. Please try again"
      })
    } else {
      // this.router.navigateByUrl('/login');
    }
  }

  showDataSharingAgreements(){
    $('#data-sharing-agreements').toggle('fast');
  }

  // Copy code to clipboard
  copyToClipboard(code_id: string) {
    // Get the code snippet element
    const codeSnippet = document.getElementById("code-snippet-"+code_id);

    // Create a temporary textarea to hold the text
    const tempTextArea: any = document.createElement("textarea");
    tempTextArea.value = codeSnippet ? codeSnippet.textContent : '';
    document.body.appendChild(tempTextArea);

    // Select the text and execute the copy command
    tempTextArea.select();
    document.execCommand("copy");

    // Remove the temporary textarea after copying
    document.body.removeChild(tempTextArea);

    // Optional: Alert the user that the text has been copied
    this.toast.showSuccess("URL copied to clipboard!");
  }

  resetAlert() {
    this.alert = { failure: "", success: "" };
  }

  // Copy code to clipboard
  copyLinkToClipboard() {
    // Get the code snippet element
    // const codeSnippet = document.getElementById("endpoint-link");

    // Create a temporary textarea to hold the text
    const tempTextArea: any = document.createElement("textarea");
    tempTextArea.value = window.location.origin + this.router.url;
    document.body.appendChild(tempTextArea);

    // Select the text and execute the copy command
    tempTextArea.select();
    document.execCommand("copy");

    // Remove the temporary textarea after copying
    document.body.removeChild(tempTextArea);

    // Optional: Alert the user that the text has been copied
    this.toast.showSuccess("Link copied to clipboard!");
  }

}

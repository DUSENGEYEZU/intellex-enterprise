import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UtilsService } from '../../services/utils.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';

declare var $:any; //JQUERY handler
declare var mapboxgl:any; //MapBox handler
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, TitleCasePipe, FormsModule],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.css'
})
export class HomeComponent {
  loader = false;
  $:any //Make JQUERY handler availble in this context
  MAIN_WORKSPACE;
  SESSION: any = null;
  alert = { failure: "", success: "" };

  ENDPOINTS: any = [];
  ORIGINAL_ENDPOINTS_LIST: any = [];

  REQUESTED_ENDPOINT = { id: "", service_id: "", workspace_id: "", url: "", method: "", worspace_name: "", service_name: "", summary: "", description: "", industry_id: "", sample_request: "", sample_response: "", purpose: "" };

  STATS = {
    is_workspace_connected: false,
    workspace_connection_status: ''
  }

  TARGET = {
    industries: [] as {industry:string}[],
    countries: [] as {country:string}[],
    selected: {
      industry: "",
      region: "",
      country: "",
      workspace: {id: "", name:""},
      service: {id: "", name:""}
    }
  }
  ALL_COUNTRIES: {code:string, name:string, longitude:string, latitude:string}[] = [];

  constructor(public utilsService: UtilsService, private router: Router, private httpClient: HttpClient, private toast: ToastService) {
    if (this.utilsService.getSession()) {
      this.SESSION = this.utilsService.getSession();
      this.MAIN_WORKSPACE = this.utilsService.getMainWorkspace();
    }
    this.$ = $; //Initialize JQUERY handler
  }

  ngOnInit() {
    this.fetchTargetMarkets();
    this.getPublicEndpoints();
    this.showGridView(); // Show map view by default
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
        // Reset the purpose for better UX
        this.REQUESTED_ENDPOINT.purpose = ""
      }, error=>{
        this.loader = false;
        this.alert.failure = "Opps! This is on us. Please try again"
      })
    } else {
      this.router.navigateByUrl('/login');
    }
  }

  getConnectionStatus(endpoint_id: string){
    if(this.SESSION){
      this.loader = true;
      this.httpClient.get<any>(this.utilsService.API_URL + `/connection/endpoint/${endpoint_id}/workspace/${this.MAIN_WORKSPACE}`).subscribe(data => {
        this.loader = false;
        if(data.data){
          this.STATS.workspace_connection_status = data.data.status;
          if(data.data.status === 'NEW'){
            this.STATS.is_workspace_connected = true;
          }else if(data.data.status === 'GRANTED'){
            this.STATS.is_workspace_connected = true;
          }else{ //DENIED
            this.STATS.is_workspace_connected = false;
          }
        }else{
          this.STATS.is_workspace_connected = false;
        }
      });
    }
  }

  getPublicEndpoints(show_map=false) {
    // We shouldn't combine target markets and workspace/service
    if(this.TARGET.selected.industry || this.TARGET.selected.region || this.TARGET.selected.country){
      // Reset workspace and service/product
      this.TARGET.selected.service = this.TARGET.selected.workspace = {id:"", name:""};
    }
    this.loader = true;
    this.httpClient.get<any>(this.utilsService.API_URL + `/endpoint/public/all?industry=${this.TARGET.selected.industry}&region=${this.TARGET.selected.region}&country=${this.TARGET.selected.country}&workspace=${this.TARGET.selected.workspace.id}&service=${this.TARGET.selected.service.id}`).subscribe(data => {
      this.loader = false;
      this.ENDPOINTS = data.data;
      this.ORIGINAL_ENDPOINTS_LIST = data.data;
      
      // Plot data on the map
      if(show_map){
        this.initMap(this.ENDPOINTS);
      }
    });
  }

  // Gets open public endpoints
  getOpenEndpoints() {
    this.loader = true;
    this.httpClient.get<any>(this.utilsService.API_URL + '/endpoint/public/open').subscribe(data => {
      this.loader = false;
      this.ENDPOINTS = data.data;
      this.ORIGINAL_ENDPOINTS_LIST = data.data;
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

    this.getConnectionStatus(endpoint_id);
  }
  resetAlert() {
    this.alert = { failure: "", success: "" };
  }

   // Get industries
   getTargetIndustries(){
    this.httpClient.get<[]>(this.utilsService.API_URL + '/endpoint/target/industries').subscribe(data=>{
      this.TARGET.industries = data;
    })
  }
  // Get countries
  getTargetCountries(){
    this.httpClient.get<[]>(this.utilsService.API_URL + '/endpoint/target/countries').subscribe(data=>{
      this.TARGET.countries = data;
    })
  }

  getAllCountries(show_map: boolean){
    this.httpClient.get<[]>(this.utilsService.API_URL + '/utils/countries/all').subscribe(data=>{
      this.ALL_COUNTRIES = data;
      // Populate endpoints only once the countries are loaded, because the map needs the coordinates
      this.getPublicEndpoints(show_map);
    })
  }

  fetchTargetMarkets(){
    this.getTargetIndustries()
    this.getTargetCountries()
  }

  resetSelectedMarket(){
    this.TARGET.selected = {
      industry: "",
      region: "",
      country: "",
      workspace: {id: "", name:""},
      service: {id: "", name:""}
    }
  }

  resetFilters(){
    this.TARGET.selected = {
      industry: "",
      region: "",
      country: "",
      workspace: {id: "", name:""},
      service: {id: "", name:""}
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

   /** FILTERS */
   async search(event_target:any){
    let keyword = "";
    if(event_target){
      keyword = event_target.value;
    }
    let temp = this.ORIGINAL_ENDPOINTS_LIST;
    this.ENDPOINTS = [];
    await temp.forEach((element: { summary: string, service_name: string, workspace_name: string }, index: string | number)=>{
      if(
        element.summary.toLowerCase().indexOf(keyword.toLowerCase()) > -1 ||
        element.service_name.toLowerCase().indexOf(keyword.toLowerCase()) > -1 ||
        element.workspace_name.toLowerCase().indexOf(keyword.toLowerCase()) > -1
      ){
        this.ENDPOINTS.push(temp[index]);
      }
    })
  }

  showMapView(){
    $('#map-view').show();
    $('#grid-view').hide();
    // Initialize the map by triggering getAllCountries(), and setting show_map to true
    this.getAllCountries(true);
  }
  showGridView(){
    $('#map-view').hide();
    $('#grid-view').show();
  }

  // Initialise MapBox
  initMap(endpoints: any[]){
    const token = environment.mapboxAccessToken;
    if (!token) {
      console.warn('Mapbox: set environment.mapboxAccessToken to enable the map view.');
      return;
    }
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v9',
        projection: 'globe', // Display the map as a globe, since satellite-v9 defaults to Mercator
        zoom: 2,
        center: [20.0, 5.0]
    });

    map.addControl(new mapboxgl.NavigationControl());

    map.on('style.load', () => {
        map.setFog({}); // Set the default atmosphere style
    });
    // Add endpoint markers to the map
    // Step 1: Group endpoints by coordinate string key
    const groupedEndpoints: { [coordKey: string]: any[] } = {};
 
    endpoints.forEach(endpoint => {
      let country = this.ALL_COUNTRIES.find(country => country.code === endpoint.target_country);
      if (!country) {
        console.error(`Country with code ${endpoint.target_country} not found`);
        return;
      }
      const lat = parseFloat(country.latitude);
      const lng = parseFloat(country.longitude);
      const coordKey = `${lat},${lng}`;

      if (!groupedEndpoints[coordKey]) {
        groupedEndpoints[coordKey] = [];
      }
    
      groupedEndpoints[coordKey].push({
        ...endpoint,
        lat,
        lng,
        countryName: country.name
      });
      
      // Step 2: Add one marker per unique coordinate
      Object.entries(groupedEndpoints).forEach(([coordKey, endpointList]) => {
        const { lat, lng, countryName } = endpointList[0]; // all have same coordinates

        const count = endpointList.length;

        // Create the custom HTML element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerText = count.toString();
        el.style.backgroundColor = '#270350'; // Set the background color
        el.style.color = '#FFFFFF'; // Set the text color
        el.style.borderRadius = '50%'; // Make it circular
        el.style.width = '50px';
        el.style.height = '50px';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '14px';
        el.style.fontWeight = 'bold';
        el.style.cursor = 'pointer';
        el.style.transition = 'background-color 0.3s ease';
        el.addEventListener('mouseover', () => {
          el.style.backgroundColor = '##2706FF'; // Change color on hover
        });
        el.addEventListener('mouseout', () => {
          el.style.backgroundColor = '##2706FF'; // Reset color on mouse out
        });
        el.addEventListener('click', () => {
          // Handle click event
          console.log(`Clicked on marker for ${countryName}`);
        });

        // Create the popup content
        const popupContent = `
        <h3>${countryName}</h3>
        <p>${count} endpoint(s) here:</p>
        <ul style="max-height: 200px; overflow-y: auto;">
          ${endpointList.map(e => `
            <li class='mb-3'>
              <a href="marketplace/endpoint?id=${e.id}&title=${e.summary}&referer=marketplace">
              ${e.summary}</a><br/>
              <span class='text-muted'>${e.service_name}</span>
            </li>`).join('')}
        </ul>
      `;

        new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent))
          .addTo(map);
      });
    })
  }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UtilsService } from './services/utils.service';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { HttpClient } from '@angular/common/http';
declare var $:any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Intellex';
  panelWidth :string = '';
  mainHeaderWidth :string = '';
  SESSION :any = null;
  INCOMING_CONNECTION_REQUESTS = 0;
  USER_WORKSPACES: { workspace_id: string, workspace_name: string }[] = [];

  constructor(
    private utilsService: UtilsService,
    private router: Router,
    private titleService: Title,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient
  ){
    this.SESSION = this.utilsService.getSession();

    if(this.SESSION){
      this.panelWidth = this.mainHeaderWidth = '';
    }else{
      this.panelWidth = this.mainHeaderWidth = '100%';
      // this.router.navigateByUrl('/marketplace')
    }
  }

  ngOnInit() {
    if(this.SESSION){
      this.getUserWorkspaces()
    }
    this.initNetworkEventListeners(); //Track and update user on network status
    // Dynamically page title accross routes (pages)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const routeTitle = this.getTitle(this.activatedRoute);
      if (routeTitle) {
        this.titleService.setTitle(routeTitle);
      }
    });

    this.http.get('../environments/config.json').subscribe((config: any) => {
      localStorage.setItem('apiUrl', config.apiUrl);
      localStorage.setItem('unit_api_call_price', config.unit_api_call_price);
    });
  }

  private getTitle(route: ActivatedRoute): string {
    let title = route.snapshot.data['title'];
    if (route.firstChild) {
      title = this.getTitle(route.firstChild);
    }
    return title;
  }

  getUserWorkspaces(){
    this.http.get<any>(this.utilsService.API_URL+'/workspace/user/'+this.SESSION.id).subscribe(data=>{
      this.USER_WORKSPACES = data.data;
    })
  }

  logout(){
    this.utilsService.destroySession();
    this.router.navigateByUrl("/marketplace");
    setTimeout(() => {
      this.utilsService.reloadPage()
    }, 3);
  }

  // Function to show the network alert
  showNetworkAlert(status: boolean) {
    const alertBanner = status===false ? document.getElementById('network-alert-danger') : document.getElementById('network-alert-success');
    if(alertBanner){
      alertBanner.style.display = 'block'; // Show the alert
      setTimeout(() => {
        alertBanner.style.display = 'none'; // Hide the alert after 3 seconds
      }, 10000);
    }
  }

  initNetworkEventListeners(){
    // Event listener for when the network goes offline
    window.addEventListener('offline', () => {
      this.showNetworkAlert(false); // Show alert when offline
    });

    // Event listener for when the network comes back online
    window.addEventListener('online', () => {
      this.showNetworkAlert(true); // Show alert when offline
      console.log('Network is back online');
    });
  }
}
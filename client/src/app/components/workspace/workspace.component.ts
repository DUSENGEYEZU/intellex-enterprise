import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UtilsService } from '../../services/utils.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.css'
})
export class WorkspaceComponent {
  alert:{failure: string, success:string} = {failure: '', success: ''}
  loader:boolean = false;
  WORKSPACE_ID:string = '';
  WORKSPACE:{name:string, description:string, logo_url: string, website_url:string, industry_id: string, created_at:string} = {
    name: '',
    description: '',
    logo_url: '',
    website_url: '',
    industry_id: '',
    created_at: ''
  }
  ENDPOINTS:any[] = [];
  API_GROUPS:any[] = [];
  /** Inline feedback for publish / unpublish / copy on this page */
  groupCatalogAlert: { success: string; failure: string } = { success: '', failure: '' };
  SESSION;
  INDUSTRIES:any[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public utilsService: UtilsService
  ){
    this.SESSION = this.utilsService.getSession()
    this.route.paramMap.subscribe(params => {
      this.WORKSPACE_ID = params.get('workspace_id') || '';
    });
  }

  ngOnInit(){
    this.getWorkspaceDetails();
    this.getPublicWorkspaceEndpoints();
    this.getGroups();
    this.getTargetIndustries();
  }

  getWorkspaceDetails(){
    this.loader = true;
    this.http.get<any>(this.utilsService.API_URL + `/workspace/${this.WORKSPACE_ID}`).subscribe(data => {
      this.loader = false;
      this.WORKSPACE = data.data;
    });
  }

  getPublicWorkspaceEndpoints() {
    this.loader = true;
    this.http.get<any>(this.utilsService.API_URL + `/endpoint/public/all?workspace=${this.WORKSPACE_ID}`).subscribe(data => {
      this.loader = false;
      this.ENDPOINTS = data.data;
    });
  }

  getGroups() {
    this.loader = true;
    this.http.get<any>(`${this.utilsService.API_URL}/endpoint/groups/workspace/${this.WORKSPACE_ID}`).subscribe((data) => {
      this.loader = false;
      const rows = data.data || [];
      this.API_GROUPS = rows.map((g: Record<string, unknown>) => ({
        ...g,
        is_public: this.normalizeGroupIsPublic(g),
      }));
    });
  }

  normalizeGroupIsPublic(g: { is_public?: unknown; isPublic?: unknown }): boolean {
    const v = g?.is_public ?? g?.isPublic;
    if (v === true || v === 1) {
      return true;
    }
    if (v === false || v === 0 || v == null) {
      return false;
    }
    if (typeof v === 'string') {
      const s = v.toLowerCase().trim();
      return s === 'true' || s === '1' || s === 't';
    }
    return false;
  }

  isGroupCatalogPublic(group: { is_public?: unknown }): boolean {
    if (typeof group?.is_public === 'boolean') {
      return group.is_public;
    }
    return this.normalizeGroupIsPublic(group as { is_public?: unknown; isPublic?: unknown });
  }

  publicGroupCatalogUrl(groupId: string): string {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/marketplace/endpoint/group?id=${encodeURIComponent(groupId)}`;
  }

  publishGroupCatalog(group: { id: string; name: string }, event?: Event) {
    event?.stopPropagation();
    this.groupCatalogAlert = { success: '', failure: '' };
    if (
      !confirm(
        `Publish “${group.name}” to the public catalog?\n\nThis will also publish every API currently in this group on the marketplace (restricted — consumers need an API key), so they appear on the shared link. Private backend URLs are never shown on the catalog page.`,
      )
    ) {
      return;
    }
    this.loader = true;
    this.http
      .put<{ status: boolean; message: string }>(`${this.utilsService.API_URL}/endpoint/group/publish/${group.id}`, {
        access: 'restricted',
      })
      .subscribe({
        next: (res) => {
          this.loader = false;
          if (res.status === true) {
            (group as { is_public?: boolean }).is_public = true;
            this.groupCatalogAlert.success = res.message || 'Catalog published.';
            this.getGroups();
          } else {
            this.groupCatalogAlert.failure = res.message || 'Publish failed.';
          }
        },
        error: () => {
          this.loader = false;
          this.groupCatalogAlert.failure = 'Publish failed.';
        },
      });
  }

  unpublishGroupCatalog(group: { id: string; name: string }, event?: Event) {
    event?.stopPropagation();
    this.groupCatalogAlert = { success: '', failure: '' };
    if (!confirm(`Remove “${group.name}” from the public catalog? Shared links will stop working.`)) {
      return;
    }
    this.loader = true;
    this.http
      .put<{ status: boolean; message: string }>(`${this.utilsService.API_URL}/endpoint/group/unpublish/${group.id}`, {})
      .subscribe({
        next: (res) => {
          this.loader = false;
          if (res.status === true) {
            (group as { is_public?: boolean }).is_public = false;
            this.groupCatalogAlert.success = res.message || 'Catalog unpublished.';
            this.getGroups();
          } else {
            this.groupCatalogAlert.failure = res.message || 'Unpublish failed.';
          }
        },
        error: () => {
          this.loader = false;
          this.groupCatalogAlert.failure = 'Unpublish failed.';
        },
      });
  }

  copyGroupCatalogLink(groupId: string, event?: Event) {
    event?.stopPropagation();
    const url = this.publicGroupCatalogUrl(groupId);
    void navigator.clipboard.writeText(url).then(
      () => {
        this.groupCatalogAlert = { success: 'Catalog link copied to clipboard.', failure: '' };
      },
      () => {
        prompt('Copy this link:', url);
      },
    );
  }

  updateWorspace(){
    if(this.WORKSPACE.name == ''){
      this.alert.failure = "You can't leave the workspace/business name empty";
    }
    let payload = {
      workspace_id: this.WORKSPACE_ID,
      name: this.WORKSPACE.name,
      description: this.WORKSPACE.description,
      industry_id: this.WORKSPACE.industry_id,
      logo_url: this.WORKSPACE.logo_url,
      website_url: this.WORKSPACE.website_url
    }
    this.loader = true;
    this.http.put<{status: boolean, message: string}>(this.utilsService.API_URL+'/workspace/update', payload).subscribe(data=>{
      this.loader = false;
      if(data.status == true){
        this.alert.success = "Changes saved successfully"
        this.utilsService.reloadPage();
      }else{
        this.alert.failure = data.message
      }
    })
  }

  // Get industries
  getTargetIndustries(){
    this.http.get<[]>(this.utilsService.API_URL + '/utils/industries/all').subscribe(data=>{
      this.INDUSTRIES = data;
    })
  }

  resetAlert() {
    this.alert = { failure: "", success: "" };
  }

}

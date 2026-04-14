import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { UtilsService } from '../../../services/utils.service';
import { ApiAccessRequestComponent } from '../../../reusable-components/api-access-request/api-access-request.component';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, RouterLink, ApiAccessRequestComponent],
  templateUrl: './group.component.html',
  styleUrl: './group.component.css'
})
export class GroupComponent {
  $:any;
  loader = false;
  loadError = '';
  SESSION: unknown = null;
  alert:{success:string, failure: string} = {success: '', failure: ''}

  GROUP: {
    id: string;
    name: string;
    description: string;
    workspace_id: string;
    members: any[];
    integrations_count: number;
    /** Endpoints added to the group in the workspace (from API) */
    group_member_count: number;
    /** Endpoints shown on this public page (individually published) */
    published_member_count: number;
  } = {
    id: '',
    name: '',
    description: '',
    workspace_id: '',
    members: [],
    integrations_count: 0,
    group_member_count: 0,
    published_member_count: 0,
  };

  PAGE_TITLE: string = '';

  constructor(
    private route: ActivatedRoute,
    private utilsService: UtilsService,
    private http: HttpClient,
    private titleService: Title,
  ){
    this.SESSION = this.utilsService.getSession();
  }

  ngOnInit(){
    this.route.queryParamMap.subscribe((q) => {
      this.loadError = '';
      this.GROUP.id = q.get('id') || '';
      this.GROUP.name = q.get('name') || '';
      this.GROUP.description = q.get('desc') || '';
      this.GROUP.workspace_id = q.get('ws') || '';
      if (!this.GROUP.id) {
        this.loadError = 'Missing group link. Open this page from your workspace using the catalog button.';
        return;
      }
      this.fetchGroupMembers();
    });
  }

  /** Public catalog API — no auth; only published group + individually published endpoints */
  fetchGroupMembers() {
    this.loader = true;
    this.GROUP.members = [];
    this.GROUP.group_member_count = 0;
    this.GROUP.published_member_count = 0;
    this.http.get<any>(`${this.utilsService.API_URL}/endpoint/group/public/${this.GROUP.id}`).subscribe({
      next: (res) => {
        this.loader = false;
        if (!res?.status || !res.data) {
          this.loadError = res?.message || 'This group is not published to the catalog yet.';
          return;
        }
        const g = res.data.group;
        this.GROUP.name = g.name;
        this.GROUP.description = g.description;
        this.GROUP.workspace_id = g.workspace_id;
        this.GROUP.members = res.data.members || [];
        this.GROUP.group_member_count = Number(res.data.group_member_count ?? 0);
        this.GROUP.published_member_count = Number(res.data.published_member_count ?? this.GROUP.members.length);
        this.PAGE_TITLE = g.name;
        this.titleService.setTitle(`Intellex | ${g.name}`);
        if (this.SESSION) {
          this.http.get<any>(`${this.utilsService.API_URL}/connection/group/${this.GROUP.id}/count`).subscribe((c) => {
            this.GROUP.integrations_count = c.data;
          });
        }
      },
      error: () => {
        this.loader = false;
        this.loadError = 'Could not load this group.';
      },
    });
  }

}
import { CommonModule, NgFor } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UtilsService } from '../../../services/utils.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, NgFor, FormsModule, RouterLink],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css'
})
export class GroupsComponent {
  loader = false;
  API_GROUPS :any = [];
  alert: { failure: string; success: string } = { failure: '', success: '' };
 
  selectedGroup: {
    id: string;
    name: string;
    description: string;
    members: any[];
    created_at: string;
    integrations_count: number;
    is_public?: boolean;
  } = {
    id: '',
    name: '',
    description: '',
    members: [],
    created_at: '',
    integrations_count: 0,
    is_public: false,
  };
  WORKSPACE_ENDPOINTS: any[] = [];
  ORIGINAL_ENDPOINTS_LIST:any[] = [];

  constructor(
    private http: HttpClient,
    private utilsService: UtilsService
  ) {
    this.getGroups();
  }

  getGroups() {
    const workspaceId = this.utilsService.getMainWorkspace();
    if (!workspaceId || String(workspaceId).trim() === '') {
      this.API_GROUPS = [];
      return;
    }
    this.loader = true;
    this.http.get<any>(`${this.utilsService.API_URL}/endpoint/groups/workspace/${workspaceId}`).subscribe((data) => {
      this.loader = false;
      const rows = data.data || [];
      this.API_GROUPS = rows.map((g: Record<string, unknown>) => ({
        ...g,
        is_public: this.normalizeGroupIsPublic(g),
      }));
    });
  }

  createGroup() {
    // Reset any previous alerts
    this.resetAlert();
    // Checks if the name is empty
    if (this.selectedGroup.name === '') {
      this.alert.failure = 'Group name cannot be empty';
      return;
    }
    // If the group has an id, it means it already exists and we should update it
    if(this.selectedGroup.id) {
      // Update group
      let payload = {
        name: this.selectedGroup.name,
        description: this.selectedGroup.description,
        group_id: this.selectedGroup.id
      }
      this.loader = true;
      this.http.patch<{status: boolean, message: string}>(`${this.utilsService.API_URL}/endpoint/group/update`, payload).subscribe(data => {
        this.loader = false;
        if(data.status === true) {
          this.getGroups();
          this.alert.success = "Group updated successfully";
        }else{
          this.alert.failure = "Failed to update group";
        }
      }, error => {
          this.loader = false;
          this.alert.failure = 'Failed to update group';
      });
    }else{
      let payload = {
        name: this.selectedGroup.name,
        description: this.selectedGroup.description,
        workspace_id: this.utilsService.getMainWorkspace(),
        created_by: this.utilsService.getSession().id
      }
      this.loader = true;
      this.http.post<{status: boolean, message: string}>(`${this.utilsService.API_URL}/endpoint/group/create`, payload).subscribe(data => {
        this.loader = false;
        if(data.status === true) {
          this.getGroups();
          this.alert.success = data.message;
        }else{
          this.alert.failure = data.message;
        }
        }, error => {
          this.loader = false;
          this.alert.failure = 'Failed to create group';
        }
      );
    }
  }

  getGroupMembers(group_id: string) {
    // Get group details from the array of groups
    this.selectedGroup = this.API_GROUPS.find((group: { id: string; }) => group.id === group_id);

    this.loader = true;
    this.http.get<any>(`${this.utilsService.API_URL}/endpoint/group/members/${group_id}`).subscribe(data => {
      this.loader = false;
      this.selectedGroup.members = data.data;
    });

    // Get integrations count
    this.http.get<any>(`${this.utilsService.API_URL}/connection/group/${group_id}/count`).subscribe(data => {
      this.selectedGroup.integrations_count = data.data;
    });
  }

  removeMember(member_id: string, group_id: string) { 
    // Confirm if the user wants to remove the member
    if (!confirm('Are you sure you want to remove this member?')) {
      return; 
    }
    this.loader = true;
    this.http.delete(`${this.utilsService.API_URL}/endpoint/group/remove/member/${member_id}/group/${group_id}`).subscribe(data => {
      this.loader = false;
      this.getGroupMembers(this.selectedGroup.id);
    });
  }

  deleteGroup(group_id: string) {
    // Confirm if the user wants to delete the group
    if (!confirm('Are you sure you want to delete this group? Make sure there are no active connections to this group')) {
      return; 
    }
    this.loader = true;
    this.http.delete<{status: boolean, message: string}>(`${this.utilsService.API_URL}/endpoint/group/delete/${group_id}`).subscribe(data => {
      this.loader = false;
      if(data.status === true) {
        this.getGroups();
      }else{
        alert(data.message);
      }
    });
  }

  addGroupMembers(){
    let selectedEndpoints = this.getSelectedEndpointsForAddingToGroup();
    const payload = { 
      group_id: this.selectedGroup.id,
      endpoint_ids: selectedEndpoints.map((endpoint: { id: string; }) => endpoint.id),
      created_by: this.utilsService.getSession().id
    }
    this.loader = true;
    this.http.post<{status: boolean, message: string}>(`${this.utilsService.API_URL}/endpoint/group/add/members`, payload).subscribe(data => {
      this.loader = false;
      this.alert.success = data.message;
    });
  }

  getWorskpaceEndpoints(){
    this.loader = true;
    this.http.get<any>(`${this.utilsService.API_URL}/endpoint/workspace/${this.utilsService.getMainWorkspace()}`).subscribe(data => {
      this.loader = false;
      this.WORKSPACE_ENDPOINTS = data.data;
      this.ORIGINAL_ENDPOINTS_LIST=data.data;
    });
  }

  async search(event_target:any){
    let keyword = "";
    if(event_target){
      keyword = event_target.value;
    }
    let temp = this.ORIGINAL_ENDPOINTS_LIST;
    this.WORKSPACE_ENDPOINTS = [];
    await temp.forEach((element: { summary: string, service_name: string, workspace_name: string }, index: number)=>{
      if( 
        element.summary.toLowerCase().indexOf(keyword.toLowerCase()) > -1 ||
        element.service_name.toLowerCase().indexOf(keyword.toLowerCase()) > -1 ||
        element.workspace_name.toLowerCase().indexOf(keyword.toLowerCase()) > -1
      ){
        this.WORKSPACE_ENDPOINTS.push(temp[index]);
      }
    })
  }

  getSelectedEndpointsForAddingToGroup(){
    return this.WORKSPACE_ENDPOINTS.filter((endpoint: { selected: boolean; }) => endpoint.selected);
  }

  setSelectedGroup(group_id: string){
    this.selectedGroup = this.API_GROUPS.find((group: { id: string; }) => group.id === group_id);
    this.selectedGroup.members = [];
  }
  resetSelectedGroup() {
    this.selectedGroup = {
      id: '',
      name: '',
      description: '',
      members: [],
      created_at: '',
      integrations_count: 0,
      is_public: false,
    };
    this.resetAlert();
  }

  /**
   * DB / JSON sometimes sends booleans as strings; `!!"false"` is true in JS — normalize explicitly.
   */
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
  resetAlert() {
    this.alert = { failure: '', success: '' };
  }

  /** Public catalog URL (readable without login); only works after the group is published */
  publicCatalogLink(groupId: string): string {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/marketplace/endpoint/group?id=${encodeURIComponent(groupId)}`;
  }

  publishGroup(group: { id: string; name: string }, event?: Event) {
    event?.stopPropagation();
    this.resetAlert();
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
        next: (data) => {
          this.loader = false;
          if (data.status === true) {
            this.alert.success = data.message || 'Group is now public.';
            (group as { is_public?: boolean }).is_public = true;
            if (this.selectedGroup?.id === group.id) {
              this.selectedGroup.is_public = true;
            }
            this.getGroups();
          } else {
            this.alert.failure = data.message || 'Publish failed';
          }
        },
        error: () => {
          this.loader = false;
          this.alert.failure = 'Publish failed';
        },
      });
  }

  unpublishGroup(group: { id: string; name: string }, event?: Event) {
    event?.stopPropagation();
    this.resetAlert();
    if (!confirm(`Remove “${group.name}” from the public catalog? Shared links will stop working.`)) {
      return;
    }
    this.loader = true;
    this.http.put<{ status: boolean; message: string }>(`${this.utilsService.API_URL}/endpoint/group/unpublish/${group.id}`, {}).subscribe({
      next: (data) => {
        this.loader = false;
        if (data.status === true) {
          this.alert.success = data.message || 'Group is private again.';
          (group as { is_public?: boolean }).is_public = false;
          if (this.selectedGroup?.id === group.id) {
            this.selectedGroup.is_public = false;
          }
          this.getGroups();
        } else {
          this.alert.failure = data.message || 'Unpublish failed';
        }
      },
      error: () => {
        this.loader = false;
        this.alert.failure = 'Unpublish failed';
      },
    });
  }

  copyPublicGroupLink(groupId: string, event?: Event) {
    event?.stopPropagation();
    const url = this.publicCatalogLink(groupId);
    void navigator.clipboard.writeText(url).then(
      () => alert('Catalog link copied:\n' + url),
      () => prompt('Copy this link:', url),
    );
  }
}

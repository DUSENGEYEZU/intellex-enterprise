import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

interface SessionInterface{
  id: string;
  first_name: string;
  last_name: string;
  token: string;
  workspaces: string[];
}

@Injectable({
  providedIn: 'root'
})

export class UtilsService {
  reloadPage() {
    location.reload();
  }

  platform_fee = 35/100; //Platform fee is 35% of the api price set by the user (publisher)

  API_URL = localStorage.getItem('apiUrl') || environment.apiUrl;
  session_name = "intellex_sess"
  main_workspace = "main_wrkspc"
  unit_api_call_price = parseFloat(localStorage.getItem('unit_api_call_price') || '') || environment.unit_api_call_price;
  irembo_pay_key = "";

  constructor(private router: Router) { }

  createSession(id: string, first_name: string, last_name: string, token: string, workspaces: any[]){
    const session: SessionInterface = {
      id: id,
      first_name: first_name,
      last_name: last_name,
      token: token,
      workspaces: workspaces
    }
    localStorage.setItem(this.session_name, JSON.stringify(session));
    this.setMainWorkspace(workspaces[0].workspace_id);
  }

  public getSession() /* : SessionInterface | null */ {
    const session = localStorage.getItem(this.session_name);
    if (session) {
      try {
        return JSON.parse(session) //as SessionInterface;
      } catch (e) {
        console.error('Error parsing session from localStorage:', e);
        return null;  // Return null if JSON parsing fails
      }
    }
    return null;  // Return null if session doesn't exist
  }


  destroySession(){
    localStorage.removeItem(this.session_name);
    localStorage.removeItem(this.main_workspace)
  }

  setMainWorkspace(workspace_id: string){
    localStorage.setItem(this.main_workspace, workspace_id);
  }

  getMainWorkspace(){
    return localStorage.getItem(this.main_workspace);
  }

  parseJSON(JSONstring: string){
    try{
      return JSON.parse(JSONstring);
    }catch(e){
      return {}
    }
  }

  public formatFilters(filter_id: string) {
    return filter_id ? filter_id.split('_').join(' '): '';
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
    alert("Link copied to clipboard!");
  }
}

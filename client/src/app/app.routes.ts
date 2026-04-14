import { Routes } from '@angular/router';
import { HomeComponent } from './components/marketplace/marketplace.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EndpointsComponent } from './components/endpoints/endpoints.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { TrafficComponent } from './components/traffic/traffic.component';
import { EndpointComponent } from './components/marketplace/endpoint/endpoint.component';
import { GroupsComponent } from './components/endpoints/groups/groups.component';
import { InboundConnectionsComponent } from './components/connections/inbound/inbound.component';
import { OutboundConnectionsComponent } from './components/connections/outbound/outbound.component';
import { GroupComponent } from './components/marketplace/group/group.component';
import { WorkspaceComponent } from './components/workspace/workspace.component';
import { BillingComponent } from './components/billing/billing.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { PayoutsComponent } from './components/payouts/payouts.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';

export const routes: Routes = [
    { path: '', redirectTo: 'marketplace', pathMatch: 'full' },
    {path: 'login', component: LoginComponent, data: { title: 'Intellex | Login' }},
    {path: 'register', component: RegisterComponent, data: { title: 'Intellex | Sign Up' }},
    {path: 'marketplace', component: HomeComponent, data: { title: 'Intellex | API Marketplace' }},
    {path: 'marketplace/endpoint', component: EndpointComponent},
    {path: 'marketplace/endpoint/group', component: GroupComponent},
    {path: 'analytics', component: DashboardComponent, data: { title: 'Intellex | Analytics' }},
    {path: 'endpoints', component: EndpointsComponent, data: { title: 'Intellex | Manage Endpoints' }},
    {path: 'endpoints/groups', component: GroupsComponent, data: { title: 'Intellex | API Groups' }},
    {path: 'connections/inbound', component: InboundConnectionsComponent, data: { title: 'Intellex | Inbound Connections' }},
    {path: 'connections/outbound', component: OutboundConnectionsComponent, data: { title: 'Intellex | Outbound Connections' }},
    {path: 'traffic', component: TrafficComponent, data: { title: 'Intellex | Traffic Logs' }},
    {path: 'workspace/:workspace_id', component: WorkspaceComponent, data: { title: 'Intellex | Workspace' }},
    {path: 'billing', component: BillingComponent, data: { title: 'Intellex | Billing' }},
    {path: 'transactions', component: TransactionsComponent, data: { title: 'Intellex | Transactions' }},
    {path: 'payouts', component: PayoutsComponent, data: { title: 'Intellex | Payouts' }},
    {path: 'forgot-password', component: ForgotPasswordComponent, data: { title: 'Intellex | Forgot Password' }},
    { path: '**', redirectTo: 'marketplace', pathMatch: 'full' }
];
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/authentication/guards/metadata/metadata';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { CreateWorkspace, UpdateWorkspace } from 'src/workspace/dtos/workspace.dto';
import { WorkspaceService } from 'src/workspace/services/workspace/workspace.service';

@ApiTags('Workspace')
@Controller('workspace')
export class WorkspaceController {

    constructor(
        private workspaceService: WorkspaceService,
        private subscriptionService: SubscriptionService
    ){}

    @Public()
    @ApiOperation({ summary: 'Create a new workspace' })
    @Post('create')
    async createWorkspace(@Body() body: CreateWorkspace){
        const workspace = await this.workspaceService.createWorkspace(body.name, body.industry_id);
        if(workspace.status == true){
            // Create workspace - user association
            const user_workspace = await this.workspaceService.addUserToWorkspace(body.creator_user_id, workspace.data.id);
            // Create wallet
            this.subscriptionService.createWallet(workspace.data.id);
            // Create subscription plan without async
            const _package = await this.subscriptionService.findPackageByName(body.subscription_package_name);
            if(_package.data) this.subscriptionService.createSubscriptionPlan(workspace.data.id, _package.data.id);
            return user_workspace;
        }else{
            return workspace;
        }
    }

    @ApiOperation({ summary: 'Get all worspaces the user belongs to' })
    @Get('user/:user_id')
    async getUserWorkspaces(@Param('user_id') user_id: string){
        return await this.workspaceService.getUserWorkspaces(user_id);
    }

    // Get workspace by ID
    @Public()
    @ApiOperation({ summary: 'Get worspace details by ID' })
    @Get(':workspace_id')
    async getWorkspaceById(@Param('workspace_id') workspace_id: string){
        return await this.workspaceService.getWorkspaceById(workspace_id);
    }

    @Public()
    @ApiOperation({ summary: 'Get total count of all workspaces' })
    @Get('organizations/count')
    async countAllWorkspaces(){
        return await this.workspaceService.countAllWorkspaces();
    }

    @ApiOperation({summary: 'Update workspace details'})
    @Put('update')
    async updateWorkspace(
        @Body() body: UpdateWorkspace
    ){
        return await this.workspaceService.updateWorkspace(body.workspace_id, body.name, body.description,body.industry_id, body.logo_url, body.website_url);
    }

    async inviteUserToWorkspace(){} //TODO

    async removeUserFromWorkspace(){} // TODO
}

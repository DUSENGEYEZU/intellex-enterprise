import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserWorkspaceEntity } from 'src/workspace/entities/user_workspace.entity';
import { WorkspaceEntity } from 'src/workspace/entities/workspace.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorkspaceService {
    constructor(
    @InjectRepository(WorkspaceEntity) private workspace: Repository<WorkspaceEntity>,
    @InjectRepository(UserWorkspaceEntity) private userWorkspace: Repository<UserWorkspaceEntity>
    ){}

    async createWorkspace(name: string, industry_id: string){
        try{
            const workspace = await this.workspace.save(
                this.workspace.create({name: name, industry_id: industry_id})
            );

            return {status: true, data: workspace}
        }catch(e){
            return {status: false, message: e.toString()}
        }
    }

    async getUserWorkspaces(user_id: string){
        const res = await this.userWorkspace.query(`
        SELECT user_workspace.*, workspace.name as workspace_name, workspace.industry_id
        FROM user_workspace, workspace
        WHERE user_workspace.user_id = '${user_id}' AND user_workspace.workspace_id::uuid = workspace.id
        `)
        return {status: true, message:"Success", data: res}
    }

    async getWorkspaceUsers(workspace_id: string){
        return await this.userWorkspace.findBy({workspace_id: workspace_id})
    }

    async updateWorkspace(workspace_id: string, name: string, description: string, industry_id: string, logo_url: string, website_url: string){
        const workspace = await this.workspace.findOneBy({id: workspace_id});
        if(workspace){
            if(name !== ''){
                workspace.name = name;
                workspace.description = description;
                workspace.industry_id = industry_id;
                workspace.logo_url = logo_url;
                workspace.website_url = website_url;
                const saved = await this.workspace.save(workspace);
                return {status: true, message:"Updated", data: saved};
            }else{
                return {status: false, message:"Name can't be empty"}
            }
        }else{
            return {status: false, message:"Workspace not found"}
        }

    }

    // Get workspace by ID
    async getWorkspaceById(workspace_id: string){
        const workspace = await this.workspace.findOneBy({id: workspace_id});
        return {status: true, message:"Success", data: workspace}
    }

    async addUserToWorkspace(user_id: string, workspace_id: string){
        //  User-workspace combination must be unique.
        const association = await this.userWorkspace.findOneBy({user_id: user_id, workspace_id: workspace_id});
        if(association){
            return {status: false, message:"The user already belongs to this workspace"}
        }else{
            try{
                const association = await this.userWorkspace.save(
                    this.userWorkspace.create({user_id: user_id, workspace_id: workspace_id})
                )
                return {status: true, data: association};
            }catch(e){
                return {status: false, message: e.toString()}
            }
        }
    }

    async countAllWorkspaces(){
        const count = await this.workspace.count();
        return {status: true, message:"Success", data: count};
    }

    // async removeUserFromWorkspace(user_id: string, workspace_id: string){} //TODO

    async verifyIfUserBelongsToWorspace(user_id: string, workspace_id: string) {
        const user_workspace = await this.userWorkspace.findOneBy({user_id: user_id, workspace_id: workspace_id});
        if(user_workspace){
            return {status: true, message: "User belongs to this workspace"}
        }else{
            return {status: false, message: "User doesn't have access to this workspace"}
        }
    }
}

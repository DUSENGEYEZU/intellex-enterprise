import { ApiProperty } from "@nestjs/swagger";

export class CreateWorkspace{
    @ApiProperty()
    name: string;

    @ApiProperty()
    industry_id: string;

    @ApiProperty()
    creator_user_id: string;

    @ApiProperty()
    subscription_package_name: string; 
}

export class UpdateWorkspace{
    @ApiProperty()
    workspace_id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    logo_url: string;

    @ApiProperty()
    website_url: string;

    @ApiProperty()
    industry_id: string;
}
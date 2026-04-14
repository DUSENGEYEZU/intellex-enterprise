import { ApiProperty } from "@nestjs/swagger";

export class EndpointGroupDto {
    @ApiProperty()
    group_id: string;

    @ApiProperty()
    public name: string;

    @ApiProperty()
    public description: string;

    @ApiProperty()
    public workspace_id: string;

    @ApiProperty()
    public created_by: string;
}

export class AddEndpointToGroupDto {
    @ApiProperty()
    public group_id: string;

    @ApiProperty()
    public endpoint_ids: string[];

    @ApiProperty()
    public created_by: string;
}
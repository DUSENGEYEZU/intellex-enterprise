import { ApiProperty } from "@nestjs/swagger";

export class CreateServiceDto{
    @ApiProperty()
    service_name: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    workspace_id: string;
    
    @ApiProperty()
    created_by: string;
}

export class UpdateServiceDto{
    @ApiProperty()
    service_id: string;

    @ApiProperty()
    service_name: string;

    @ApiProperty()
    description: string;
}
import { ApiProperty } from "@nestjs/swagger";

export enum ConnectionStatuses{
    NEW = 'NEW',
    GRANTED = 'GRANTED',
    DENIED = 'DENIED'
}

export class CreateConnectionDto{
    @ApiProperty()
    service_id: string;

    @ApiProperty()
    endpoint_id: string;

    @ApiProperty()
    endpoint_group_id: string;

    @ApiProperty()
    consumer_workspace_id: string;

    @ApiProperty()
    producer_workspace_id: string;

    @ApiProperty({required: true})
    purpose: string;

    @ApiProperty()
    created_by: string;
}
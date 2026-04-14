import { ApiProperty } from "@nestjs/swagger";

export enum EndpointParamKind{
    QUERY = 'param',
    PATH = 'path',
    HEADER = 'header',
}

export class CreateEndpointParamDto{
    @ApiProperty()
    kind: EndpointParamKind;

    @ApiProperty()
    key: string;

    @ApiProperty()
    value: string;

    @ApiProperty()
    is_required: boolean;

    @ApiProperty()
    endpoint_id: string;
}

export class UpdateEndpointParamDto {
    @ApiProperty()
    param_id: string;

    @ApiProperty()
    key: string;

    @ApiProperty()
    is_required: boolean;

    @ApiProperty()
    value: string;
}
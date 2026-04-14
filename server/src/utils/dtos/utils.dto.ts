import { ApiProperty } from "@nestjs/swagger";

export class UtilsDtos{
    @ApiProperty()
    JSONPayload: JSON;

    @ApiProperty()
    formDataPayload: string;
}
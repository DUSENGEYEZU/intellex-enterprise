import { ApiProperty } from "@nestjs/swagger";
import { Method } from "axios";

export class KeyValuePair{
  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;
}

/** One documented error scenario; optional sample request for that scenario */
export class EndpointErrorCaseDto {
  @ApiProperty({ description: 'Short label for this error scenario (e.g. "Invalid UPI")' })
  case_title: string;

  @ApiProperty({ description: 'Sample error body as JSON string' })
  sample_error_object: string;

  @ApiProperty({ required: false, enum: ['json', 'multi_part'], description: 'How sample request is represented for this case' })
  request_payload_type?: 'json' | 'multi_part';

  @ApiProperty({ required: false, description: 'Sample request JSON when request_payload_type is json' })
  sample_request_object?: string;

  @ApiProperty({ type: [KeyValuePair], required: false, description: 'Sample form fields when request_payload_type is multi_part' })
  multi_part?: KeyValuePair[];
}

export class createEndpointDto{
    @ApiProperty()
    public summary: string;
  
    @ApiProperty()
    public description: string;
    
    @ApiProperty()
    public url: string;
    
    @ApiProperty()
    public method: Method;  
    
    @ApiProperty()
    public call_fee: number;
    
    @ApiProperty({required: false})
    public sample_request_object: string;
    
    @ApiProperty({required: false})
    public sample_response_object: string;

    @ApiProperty({required: false})
    public sample_error_object: string;

    @ApiProperty({ type: [EndpointErrorCaseDto], required: false, description: 'Multiple error scenarios; unlimited entries' })
    public error_cases?: EndpointErrorCaseDto[];

    @ApiProperty()
    public service_id: string;

    @ApiProperty()
    public workspace_id: string;

    @ApiProperty({nullable: true})
    public target_industry: string;
  
    @ApiProperty({nullable: true})
    public target_region: string;
  
    @ApiProperty({nullable: true})
    public target_country: string;

    @ApiProperty({required: false})
    public created_by: string;

    @ApiProperty({default: 1})
    public version: number;

    @ApiProperty({ type: [KeyValuePair] })
    public params: KeyValuePair[];

    @ApiProperty({ type: [KeyValuePair] })
    public headers: KeyValuePair[];

    @ApiProperty({ type: [KeyValuePair] })
    public multi_part: KeyValuePair[];
}

// export enum Method {
//     GET,
//     POST,
//     PUT,
//     PATCH
//   }

  export class UpdateEndpointDto{
    @ApiProperty()
    endpoint_id: string;

    @ApiProperty()
    public summary: string;
  
    @ApiProperty()
    public description: string;
    
    @ApiProperty()
    public endpoint: string;

    @ApiProperty()
    public service_id: string;
    
    @ApiProperty()
    public method: Method;

    @ApiProperty()
    public call_fee: number;
    
    @ApiProperty({required: false})
    public sample_request_object: string;
    
    @ApiProperty({required: false})
    public sample_response_object: string;

    @ApiProperty({required: false})
    public sample_error_object: string;

    @ApiProperty({ type: [EndpointErrorCaseDto], required: false })
    public error_cases?: EndpointErrorCaseDto[];

    @ApiProperty({nullable: true})
    public target_industry: string;
  
    @ApiProperty({nullable: true})
    public target_region: string;
  
    @ApiProperty({nullable: true})
    public target_country: string;

    @ApiProperty({default: 1})
    public version: number;

    @ApiProperty({ type: [KeyValuePair] })
    public params: KeyValuePair[];

    @ApiProperty({ type: [KeyValuePair] })
    public multi_part: KeyValuePair[];

    @ApiProperty({ type: [KeyValuePair] })
    public headers: KeyValuePair[];
  }
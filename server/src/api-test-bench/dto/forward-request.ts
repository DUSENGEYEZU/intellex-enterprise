export class ForwardRequestDto {
  id: string;
  method: string;
  url: string;
  summary: string;
  description: string;
  sample_response_object: string;
  sample_request_object: string;
  sample_error_object: string;
  service_id: string;
  workspace_id: string;
  target_industry: string;
  target_region: string;
  target_country: string;
  created_by: string;
  call_fee: number;
  version: number;
  params: { key: string; value: string; id: string }[];
  headers: { key: string; value: string; id: string }[];
  multi_part: { key: string; value: string; id: string }[];
  form_data: { key: string; value: string; id: string; valueType: string }[];
  body_type: string;
}

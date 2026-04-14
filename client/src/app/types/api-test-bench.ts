type KeyValueItem = {
  key: string;
  value: string;
  id: string;
};

type FileType = {
  lastModified : string;
  lastModifiedDate :string;
  name: string;
  size: string;
  type:string;
  webkitRelativePath:string
}

export type FormDataItem = {
  key: string;
  value: string | File;
  id: string;
  valueType: string;
};

export type Endpoint = {
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
  params: KeyValueItem[];
  headers: KeyValueItem[];
  multi_part: KeyValueItem[];
  form_data: any[];
  body_type: string;
};

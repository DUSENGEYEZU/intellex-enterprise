import { Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import { ForwardRequestDto } from '../dto/forward-request';

@Injectable()
export class ApiTestBenchService {
  async forwardRequest(
    endpoint: ForwardRequestDto,
    files: Express.Multer.File[],
  ): Promise<{
    status: number;
    headers: Record<string, any>;
    data: any;
    error?: string;
  }> {
    try {
      const { method, url, headers, params, form_data, body_type } = endpoint;
      const requestHeaders = headers?.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      const queryParams = params?.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      let body: any = null;

      if (body_type === 'formData') {
        const form = new FormData();

        form_data?.forEach(fd => {
          form.append(fd.key, fd.value);
        });

        files?.forEach(file => {
          form.append(file.fieldname, file.buffer, file.originalname);
        });

        body = form;
        Object.assign(requestHeaders, form.getHeaders()); // Add multipart headers
      } else {
        // Assume JSON
        body = endpoint;
      }

      const axiosOptions = {
        method,
        url,
        headers: requestHeaders,
        params: queryParams,
        data: body,
        validateStatus: () => true, // Allow all HTTP response codes
      };

      const response = await axios(axiosOptions);
      return {
        status: response.status,
        headers: response.headers,
        data: response.data,
      };
    } catch (err: any) {
      console.error('Error forwarding request:', err?.message || err);


      return {
        status: 500,
        headers: {},
        data: null,
        error: err?.message || 'Unknown error occurred',
      };


    }
  }
}

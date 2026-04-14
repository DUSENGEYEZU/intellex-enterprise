import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

import { ConfigurationService } from '../../configuration/configuration.service';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { IndustryEntity } from '../entities/industry.entity';
import { Repository } from 'typeorm';
import { RegionEntity } from '../entities/region.entity';
import { CountryEntity } from '../entities/country.entity';
import * as cheerio from 'cheerio';
import * as https from 'https';

@Injectable()
export class UtilsService {
  public constructor(
    private http: HttpService,
    private configService: ConfigurationService,
    @InjectRepository(IndustryEntity) private industryEntity: Repository<IndustryEntity>,
    @InjectRepository(RegionEntity) private regionEntity: Repository<RegionEntity>,
    @InjectRepository(CountryEntity) private countryEntity: Repository<CountryEntity>
  ) {}

  /**
   * Filter out forbidden headers that cannot be set manually in fetch API
   * These headers are managed automatically by the HTTP client
   * 
   * Express Request.headers is an IncomingHttpHeaders object that needs special handling
   */
  private filterForbiddenHeaders(headers: any): Record<string, string> {
    const forbiddenHeaders = new Set([
      'connection',
      'host',
      'content-length',
      'upgrade',
      'expect',
      'transfer-encoding',
      'te',
      'keep-alive',
      'proxy-connection',
      'proxy-authenticate',
      'proxy-authorization'
    ]);

    const filtered: Record<string, string> = {};
    
    // Convert headers to a plain object - handle Express IncomingHttpHeaders
    const headersObj = headers || {};
    
    // Properly iterate through all headers, handling Express's IncomingHttpHeaders structure
    // Use hasOwnProperty check to avoid inherited properties
    for (const key in headersObj) {
      if (Object.prototype.hasOwnProperty.call(headersObj, key)) {
        const normalizedKey = key.toLowerCase().trim();
        
        // Skip forbidden headers (case-insensitive)
        if (!forbiddenHeaders.has(normalizedKey)) {
          // Get the value - handle both string and string[] (Express can return arrays)
          const value = headersObj[key];
          if (value !== undefined && value !== null && value !== '') {
            // Always use lowercase header names for consistency with fetch API
            const headerValue = Array.isArray(value) ? value[0] : value;
            filtered[normalizedKey] = String(headerValue).trim();
          }
        }
      }
    }
    
    // Also handle case where headers might have Symbol properties or non-enumerable keys
    // Get all own property names including non-enumerable
    try {
      const allKeys = Object.getOwnPropertyNames(headersObj);
      for (const key of allKeys) {
        const normalizedKey = key.toLowerCase().trim();
        if (!forbiddenHeaders.has(normalizedKey) && !filtered.hasOwnProperty(normalizedKey)) {
          const value = headersObj[key];
          if (value !== undefined && value !== null && value !== '' && typeof value !== 'function') {
            const headerValue = Array.isArray(value) ? value[0] : value;
            filtered[normalizedKey] = String(headerValue).trim();
          }
        }
      }
    } catch (e) {
      // Ignore errors in property enumeration
    }
    
    return filtered;
  }

  public sendEmail(to_email: string, to_name: string, subject: string, message: string) {

    const payload = {
      to_name: to_name,
      to_email: to_email,
      sender_name: 'Intellex',
      sender_email: 'no-reply@intellex.dev',
      subject: subject,
      message: message,
    };

    const url = this.configService.NOTIFICATION_API;
    if (!url) return;
    this.http.post(url, payload).subscribe({
      next: (data) => console.log(data?.data),
      error: (err) => console.error('Notification API error:', err?.message ?? err),
    });
  }

  /**
   * Create clean fetch options with minimal headers (only Content-Type for JSON).
   * Optional extraHeaders (e.g. x-api-key for Kubaka backend) are merged in.
   */
  private createFetchOptions(
    method: string,
    body?: BodyInit,
    isJson: boolean = false,
    extraHeaders?: Record<string, string>
  ): RequestInit {
    const options: any = { method };
    if (body !== undefined) {
      options.body = body;
    }
    options.headers = { ...(extraHeaders || {}) };
    if (isJson && typeof body === 'string') {
      options.headers['Content-Type'] = 'application/json';
    }
    return options;
  }

  /** Hosts that require the Kubaka API key (x-api-key) from env. */
  private readonly KUBAKA_API_HOSTS = [
    'backend.kubaka.gov.rw',
    'api-gatway.kubaka.gov.rw',
    'apiirembotesting.kubaka.gov.rw',
    'apis.kubaka.gov.rw',
    'payment-api.kubaka.gov.rw',
    'api.kubaka.gov.rw',
  ];

  /**
   * Headers to send when the request targets a Kubaka API (e.g. x-api-key).
   * Uses API_KEY from env (set in .env and passed via docker-compose for Kubaka).
   */
  private getKubakaBackendHeaders(url: string): Record<string, string> {
    const isKubakaHost = this.KUBAKA_API_HOSTS.some((host) => url.includes(host));
    if (!isKubakaHost) {
      return {};
    }
    const apiKey = process.env.API_KEY?.trim();
    if (!apiKey) {
      console.warn('Kubaka API URL detected but API_KEY is not set in env - x-api-key will not be sent');
      return {};
    }
    console.log('Adding x-api-key header for Kubaka API');
    return {
      'x-api-key': apiKey,
      'Accept': '*/*',
    };
  }

  public async httpRequest(method: string, url:string, headers, payload, files?: Express.Multer.File[]){
    // External endpoint is open - send minimal headers only (Content-Type for JSON)
    console.log('Sending request to external endpoint');
    console.log('Request URL:', url);
    console.log('Request method:', method);
    
    // Validate URL
    try {
      new URL(url); // This will throw if URL is invalid
    } catch (e) {
      console.error('Invalid URL:', url, e);
      throw new Error(`Invalid URL format: ${url}`);
    }

    // When targeting Kubaka backend, always send x-api-key from env
    const kubakaHeaders = this.getKubakaBackendHeaders(url);
    
    if(method.toLocaleLowerCase() === 'post'){
      // Check if we have files or multipart data
      const hasFiles = files && files.length > 0;
      const isMultipart = headers['content-type']?.toString().toLowerCase().startsWith('multipart/form-data');
      
      let response: Response;
      if(hasFiles || isMultipart){
        // response = await fetch(url, {
        //   method: 'POST',
        //   headers: headers,
        //   body: payload
        // });
        // Ensure payload is correctly formatted as FormData
        let formData = new FormData();

        // Check if payload is already a FormData instance
        if (payload instanceof FormData) {
            formData = payload; // Use it directly
        } else {
            // Manually append form fields and files
            for (const key in payload) {
                if (Object.prototype.hasOwnProperty.call(payload, key)) {
                    formData.append(key, payload[key]);
                }
            }
            console.log(files)
            // Append files
            if(files && files.length > 0){
              files.forEach((file) => {
                // Convert Buffer to Uint8Array for Blob compatibility
                const uint8Array = new Uint8Array(file.buffer);
                formData.append(file.fieldname, new Blob([uint8Array], { type: file.mimetype }), file.originalname);
              });
            }
        }

        // No headers needed - fetch will auto-set content-type with boundary for multipart
        // Use helper to create clean options without headers
        try {
          response = await fetch(url, this.createFetchOptions('POST', formData, false, kubakaHeaders));
          console.log(`POST multipart request sent - ${files?.length || 0} file(s), Content-Type auto-set by fetch with boundary`);
        } catch (fetchError: any) {
          console.error('Fetch error for multipart request:', fetchError.message, fetchError.cause);
          throw new Error(`Failed to fetch ${url}: ${fetchError.message}`);
        }
      }else{
        // For JSON requests, we need Content-Type header so the server can parse JSON body
        try {
          const body = payload ? JSON.stringify(payload) : undefined;
          response = await fetch(url, this.createFetchOptions('POST', body, true, kubakaHeaders));
          console.log('JSON request sent with Content-Type: application/json');
        } catch (fetchError: any) {
          console.error('Fetch error for JSON request:', fetchError.message, fetchError.cause);
          throw new Error(`Failed to fetch ${url}: ${fetchError.message}`);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        console.error(errorData, "The other side returned an error with " + url);
        throw errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      }
      const data = await response.json();
      return data;

    }else if(method.toLocaleLowerCase() === 'get'){
      let response: Response;
      try {
        response = await fetch(url, this.createFetchOptions('GET', undefined, false, kubakaHeaders));
        console.log('GET request sent - no headers needed');
      } catch (fetchError: any) {
        console.error('Fetch error for GET request:', fetchError.message, fetchError.cause);
        throw new Error(`Failed to fetch ${url}: ${fetchError.message}`);
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        console.error(errorData, "The other side returned an error with " + url);
        throw errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      }
      const data = await response.json();
      return data
    }else if(method.toLocaleLowerCase() === 'put'){
      let response: Response;
      try {
        // Check if we have files for PUT (multipart)
        const hasFiles = files && files.length > 0;
        const isMultipart = headers['content-type']?.toString().toLowerCase().startsWith('multipart/form-data');
        
        if(hasFiles || isMultipart){
          // Handle file uploads for PUT
          let formData = new FormData();
          if (payload && !(payload instanceof FormData)) {
            for (const key in payload) {
              if (Object.prototype.hasOwnProperty.call(payload, key)) {
                formData.append(key, payload[key]);
              }
            }
          }
          if(files && files.length > 0){
            files.forEach((file) => {
              const uint8Array = new Uint8Array(file.buffer);
              formData.append(file.fieldname, new Blob([uint8Array], { type: file.mimetype }), file.originalname);
            });
          }
          response = await fetch(url, this.createFetchOptions('PUT', formData, false, kubakaHeaders));
          console.log('PUT request sent with FormData (multipart)');
        } else {
          // JSON PUT request
          const body = payload ? JSON.stringify(payload) : undefined;
          response = await fetch(url, this.createFetchOptions('PUT', body, true, kubakaHeaders));
          console.log('PUT request sent with Content-Type: application/json');
        }
      } catch (fetchError: any) {
        console.error('Fetch error for PUT request:', fetchError.message, fetchError.cause);
        throw new Error(`Failed to fetch ${url}: ${fetchError.message}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        console.error(errorData, "The other side returned an error with " + url);
        throw errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      }
      const data = await response.json();
      return data
    }else if(method.toLocaleLowerCase() === 'patch'){
      let response: Response;
      try {
        // Check if we have files for PATCH (multipart)
        const hasFiles = files && files.length > 0;
        const isMultipart = headers['content-type']?.toString().toLowerCase().startsWith('multipart/form-data');
        
        if(hasFiles || isMultipart){
          // Handle file uploads for PATCH
          let formData = new FormData();
          if (payload && !(payload instanceof FormData)) {
            for (const key in payload) {
              if (Object.prototype.hasOwnProperty.call(payload, key)) {
                formData.append(key, payload[key]);
              }
            }
          }
          if(files && files.length > 0){
            files.forEach((file) => {
              const uint8Array = new Uint8Array(file.buffer);
              formData.append(file.fieldname, new Blob([uint8Array], { type: file.mimetype }), file.originalname);
            });
          }
          response = await fetch(url, this.createFetchOptions('PATCH', formData, false, kubakaHeaders));
          console.log('PATCH request sent with FormData (multipart)');
        } else {
          // JSON PATCH request
          const body = payload ? JSON.stringify(payload) : undefined;
          response = await fetch(url, this.createFetchOptions('PATCH', body, true, kubakaHeaders));
          console.log('PATCH request sent with Content-Type: application/json');
        }
      } catch (fetchError: any) {
        console.error('Fetch error for PATCH request:', fetchError.message, fetchError.cause);
        throw new Error(`Failed to fetch ${url}: ${fetchError.message}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        console.error(errorData, "The other side returned an error with " + url);
        throw errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      }
      const data = await response.json();
      return data
    }else if(method.toLocaleLowerCase() === 'delete'){
      let response: Response;
      try {
        response = await fetch(url, this.createFetchOptions('DELETE', undefined, false, kubakaHeaders));
        console.log('DELETE request sent - no headers needed');
      } catch (fetchError: any) {
        console.error('Fetch error for DELETE request:', fetchError.message, fetchError.cause);
        throw new Error(`Failed to fetch ${url}: ${fetchError.message}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        console.error(errorData, "The other side returned an error with " + url);
        throw errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      }
      const data = await response.json();
      return data
    }else if(method.toLocaleLowerCase() === 'head'){
      let response: Response;
      try {
        response = await fetch(url, this.createFetchOptions('HEAD', undefined, false, kubakaHeaders));
        console.log('HEAD request sent - no headers needed');
      } catch (fetchError: any) {
        console.error('Fetch error for HEAD request:', fetchError.message, fetchError.cause);
        throw new Error(`Failed to fetch ${url}: ${fetchError.message}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        console.error(errorData, "The other side returned an error with " + url);
        throw errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      }
      const data = await response.json();
      return data
    }else{
      return {status: false, message:`Unsported API method: ${method}`}
    }
  }

  // Get all industries
  async getIndustries(){
    return await this.industryEntity.find();
  }

  // Get all regions
  async getRegions(){
    return await this.regionEntity.find();
  }

  // Get all countries
  async getCountries(){
    return await this.countryEntity.find();
  }

  // Get countries by region
  async getCountriesByRegionId(region_id: string){
    return await this.countryEntity.findBy({region_id: region_id});
  }

  // Transform HTML to JSON
  async fetchAndTransformHtmlTable(url: string, method:string='GET', payload?, payloadFormat?){
    try {
      // Fetch HTML content from the URL using HttpService
      let response
      if(method === 'GET'){
        response = await firstValueFrom(this.http.get(url));
      }
      if(method === 'POST'){
        response = await firstValueFrom(
          this.http.post(url, payload, {
            headers: {
              'Content-Type': payloadFormat //'application/x-www-form-urlencoded', // Set the content type for form data
            },
          })
        );
      }

      // Load the HTML content using Cheerio
      const $ = cheerio.load(response.data);

      // Find the table (assumes there's only one table or you want the first one)
      const table = $('table');
      if (!table.length) {
        return {status: false, message:'No table found on the page'};
      }

      // Get the headers (check if headers are in <thead> or first <tr> in <tbody>)
      const headers: string[] = [];
      const thead = table.find('thead');
      const tbody = table.find('tbody');

      if (thead.length) {
        // If <thead> exists, extract headers from there
        thead.find('th').each((i, element) => {
          headers.push($(element).text().trim());
        });
      } else if (tbody.length) {
        // If <thead> doesn't exist, assume the first row of <tbody> contains the headers
        tbody.find('tr').first().find('th, td').each((i, element) => {
          headers.push($(element).text().trim());
        });
      }

      // Parse the table body rows (skip the first row if it was used as header)
      const rows = [];
      tbody.find('tr').each((rowIndex, row) => {
        // Skip the first row if it contains headers
        if (rowIndex === 0 && headers.length > 0) return;

        const rowData = {};
        $(row)
          .find('td')
          .each((cellIndex, cell) => {
            rowData[headers[cellIndex]] = $(cell).text().trim();
          });

        rows.push(rowData);
      });
      return rows;

    } catch (error) {
      console.error('Error parsing table:', error.message);
      throw new Error('Failed to fetch and parse table data');
    }
  }

  /****************************************
   * Using AI to anonymize JSON data ***
  ***************************************/

  // Option 1: Function to anonymize personal information in a JSON object
  async anonymizePersonalInfo(json: JSON): Promise<{ status: boolean; data?: JSON; message?: string }> {
    // Tests if the json argument is actually a valid JSON object
    if (typeof json !== 'object' || json === null) {
      return { status: false, message: 'Invalid JSON object' };
    }

    // Convert the entire JSON object into a string representation for OpenAI
    const jsonString = JSON.stringify(json, null, 2);

    // Call the OpenAI API to anonymize the entire JSON object
    const anonymizedJsonString = await this.anonymizeWithAI(jsonString);

    // Try to parse the returned anonymized string back to a JSON object
    try {
      const anonymizedJson = JSON.parse(anonymizedJsonString);
      return { status: true, data: anonymizedJson };
    } catch (error) {
      return { status: false, message: 'Failed to parse anonymized JSON. '+error.toString() };
    }
  }

  // Option 2: Function to anonymize personal information from a URL
  async anonymizePersonalInfoFromUrl(url: string): Promise<{ status: boolean; data?: JSON; message?: string }> {
    try {
      // Fetch JSON content from the URL using HttpService
      const response = await firstValueFrom(this.http.get(url));

      // Try to parse the fetched JSON content
      const json = response.data;
      return this.anonymizePersonalInfo(json);
    } catch (error) {
      return { status: false, message: 'Failed to fetch JSON content from URL. '+error.toString() };
    }
  }

  // Function to anonymize using the OpenAI API
  async anonymizeWithAI(jsonString: string): Promise<string> {
    const prompt = `
      Please anonymize the following JSON object by replacing sensitive personal information with generic placeholders.
      The anonymized output should have the same structure as the original JSON object, but without any sensitive data.

      Original JSON:
      ${jsonString}

      Anonymized JSON:
    `;

    console.log('Sending request to OpenAI API...');

    try {
      const response = await firstValueFrom(
        this.http.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo', // or 'gpt-4' based on availability
            messages: [{role:'user', content: prompt}],
            // prompt: prompt,
            // max_tokens: 1000,  // Adjust token limit as necessary
            temperature: 0.5,
            // top_p: 1,
            // n: 1,
            // stop: ['\n']
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            }
          }
        )
      );
      console.log('OpenAI API response:', response.data.choices[0].message.content.trim());
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error during OpenAI API request:', error);
      return JSON.stringify({ status: false, message: 'Anonymization failed' });
    }
  }

  /****************************************
    * END Using AI to anonymize JSON data ***
  ***************************************/

  /***************************************
   ** IREMBO API CALL
  *********************************/

   async initiateIremboPayment(url, payload, headers){
    // Create an HTTPS agent that ignores SSL certificate errors
    const agent = new https.Agent({
      rejectUnauthorized: false,  // Disables SSL certificate validation
    });

    const { data } = await firstValueFrom(
      this.http.post(url, payload, { headers, httpsAgent: agent }).pipe(
          catchError((error: AxiosError) => {
              console.error(error.response.data, "The other side returned an error with " + url);
              throw "The other side returned an error with " + url
          }),
      )
    )
    return data
   }
}


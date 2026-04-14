import { Body, Controller, Get, Param, Post, Query, Request } from '@nestjs/common';
import { UtilsService } from '../services/utils.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/authentication/guards/metadata/metadata';
import { UtilsDtos } from '../dtos/utils.dto';

import { OtpService } from '../services/otp/otp.service';

@ApiTags("Utils")
@Controller('utils')
export class UtilsController {
    constructor(private utilsService: UtilsService, private otpService: OtpService) { }

    @Get('industries/all')
    @Public()
    async getAllIndustries() {
        return await this.utilsService.getIndustries();
    }

    @Get('regions/all')
    @Public()
    async getAllRegions() {
        return await this.utilsService.getRegions();
    }

    @Get('countries/all')
    @Public()
    async getAllCountries() {
        return await this.utilsService.getCountries();
    }

    @Get('countries/region/:region_id')
    @Public()
    async getCountriesByRegion(@Param('region_id') region_id: string) {
        return await this.utilsService.getCountriesByRegionId(region_id);
    }

    @Get('transform/html/tojson/:url')
    @Public()
    async transformHtmlToJSON(@Param('url') url: string) {
        return await this.utilsService.fetchAndTransformHtmlTable(url);
    }

    @Post('transform/html/tojson/:url')
    @Public()
    async transformHtmlToJSONwithPost(
        @Param('url') url: string,
        @Body() body: UtilsDtos
    ) {
        let payload;
        let payload_format;
        if(body.JSONPayload){
            payload = body.JSONPayload;
            payload_format = 'application/json; charset=utf-8';
        }
        if(body.formDataPayload){
            payload = body.formDataPayload;
            payload_format = 'application/x-www-form-urlencoded';
        }

        return await this.utilsService.fetchAndTransformHtmlTable(url, 'POST', payload, payload_format);
    }

    // Anonymizes JSON data
    @Post('anonymize/json')
    @ApiOperation({summary:"Anonymize JSON data by passing JSON data directly into the payload"})
    @Public()
    async anonymizePersonalInfo(@Request() request) {
        return await this.utilsService.anonymizePersonalInfo(request.body);
    }

    // Anonymizes JSON data from URL
    @Get('anonymize/json')
    @ApiOperation({summary:"Anonymize JSON data by passing URL into the query parameter. The passed in URL must return JSON data"})
    @Public()
    @ApiQuery({
        name: 'url',           // Name of the query parameter
        description: 'The URL to be processed',  // Description for Swagger documentation
        required: true,       // Set to true if the parameter is mandatory
        type: String           // Type of the parameter (string in this case)
      })
    async anonymizePersonalInfoFromUrl(
        @Query('url') url: string) {
        return await this.utilsService.anonymizePersonalInfoFromUrl(url);
    }

}
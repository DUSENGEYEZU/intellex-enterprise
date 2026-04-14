// forward-request.controller.ts
import { Controller, Post, Body, UploadedFiles, UseInterceptors,  BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';

import { ApiTestBenchService } from '../services/api-test-bench.service';
import { Public } from 'src/authentication/guards/metadata/metadata';
import { ForwardRequestDto } from '../dto/forward-request';

@Controller('forward-request')
export class ApiTestBenchController {
  constructor(private readonly apiTestBenchService: ApiTestBenchService) {}

  @ApiOperation({ summary: 'A proxy that forwards requests' })
@Public()
@Post('submit')
@UseInterceptors(FilesInterceptor('file')) // will only apply for multipart/form-data
async forwardRequest(
  @UploadedFiles() files: Array<Express.Multer.File>,
  @Body('meta') meta: string, // FormData scenario
  @Body() body: any           // JSON scenario
) {
  let endpointDto: ForwardRequestDto;

  if (meta) {
    // It's multipart/form-data
    try {
      endpointDto = JSON.parse(body);
    } catch (err) {
      throw new BadRequestException(`Invalid JSON in 'meta': ${err.message}`);
    }
  } else {
    // It's application/json
    endpointDto = body;
  }

  console.log("body",body)
  return this.apiTestBenchService.forwardRequest(endpointDto, files ?? []);
}

}

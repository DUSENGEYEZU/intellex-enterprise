import { Module } from '@nestjs/common';

import { ApiTestBenchController } from './controllers/api-test-bench.controllers.controller';
import { ApiTestBenchService } from './services/api-test-bench.service';

@Module({
  controllers: [ ApiTestBenchController],
  providers: [ApiTestBenchService]
})
export class ApiTestBenchModule {}

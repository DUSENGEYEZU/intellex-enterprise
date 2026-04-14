import { Test, TestingModule } from '@nestjs/testing';
import { ApiTestBenchService } from './api-test-bench.service';

describe('ServicesService', () => {
  let service: ApiTestBenchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiTestBenchService],
    }).compile();

    service = module.get<ApiTestBenchService>(ApiTestBenchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

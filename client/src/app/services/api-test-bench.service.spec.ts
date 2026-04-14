import { TestBed } from '@angular/core/testing';

import { ApiTestBenchService } from './api-test-bench.service';

describe('ApiTestBenchService', () => {
  let service: ApiTestBenchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiTestBenchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

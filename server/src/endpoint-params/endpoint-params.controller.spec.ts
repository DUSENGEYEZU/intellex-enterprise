import { Test, TestingModule } from '@nestjs/testing';
import { EndpointParamsController } from './endpoint-params.controller';

describe('EndpointParamsController', () => {
  let controller: EndpointParamsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EndpointParamsController],
    }).compile();

    controller = module.get<EndpointParamsController>(EndpointParamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

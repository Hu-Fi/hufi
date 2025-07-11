import { Test } from '@nestjs/testing';

import { HelloService } from './hello.service';

describe('HelloService', () => {
  let service: HelloService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HelloService],
    }).compile();

    service = moduleRef.get<HelloService>(HelloService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

jest.mock('@/logger');

import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { Web3ConfigService } from '@/config';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';
import { mockWeb3ConfigService } from '@/modules/web3/fixtures';

import { PayoutsService } from './payouts.service';

const mockStorageService = createMock<StorageService>();
const mockWeb3Service = createMock<Web3Service>();

describe('PayoutsService', () => {
  let payoutsService: PayoutsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PayoutsService,
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: Web3Service,
          useValue: mockWeb3Service,
        },
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
      ],
    }).compile();

    payoutsService = moduleRef.get<PayoutsService>(PayoutsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(payoutsService).toBeDefined();
  });
});

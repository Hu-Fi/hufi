import { Test } from '@nestjs/testing';
import { JsonRpcProvider } from 'ethers';

import { Web3ConfigService } from '@/config';

import { generateTestnetChainId, mockWeb3ConfigService } from './fixtures';
import { Web3Service } from './web3.service';

describe('Web3Service', () => {
  let web3Service: Web3Service;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
        Web3Service,
      ],
    }).compile();

    web3Service = moduleRef.get<Web3Service>(Web3Service);
  });

  it('should succesfully create service instance', () => {
    /**
     * Constructor throws if configuration is invalid,
     * so check for an instance as litmus test
     */
    expect(web3Service).toBeDefined();
  });

  describe('getProvider', () => {
    it('should return provider for a valid chainId on testnet', () => {
      const validChainId = generateTestnetChainId();

      const provider = web3Service.getProvider(validChainId);
      expect(provider).toBeInstanceOf(JsonRpcProvider);
    });

    it('should throw if invalid chain id provided', () => {
      const invalidChainId = -42;

      expect(() => web3Service.getProvider(invalidChainId)).toThrow(
        `No rpc provider for provided chain id: ${invalidChainId}`,
      );
    });
  });
});

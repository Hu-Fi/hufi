import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-vitest';
import { Test } from '@nestjs/testing';
import { FeeData, JsonRpcProvider, Provider } from 'ethers';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import type { Mock } from 'vitest';

import { Web3ConfigService } from '@/config';

import { generateTestnetChainId, mockWeb3ConfigService } from './fixtures';
import type { WalletWithProvider } from './types';
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

  test('should succesfully create service instance', () => {
    /**
     * Constructor throws if configuration is invalid,
     * so check for an instance as litmus test
     */
    expect(web3Service).toBeDefined();
  });

  describe('getSigner', () => {
    test('should return correct signer for a valid chainId on testnet', () => {
      const validChainId = generateTestnetChainId();

      const signer = web3Service.getSigner(validChainId);
      expect(signer).toBeDefined();
      expect(signer.address).toEqual(mockWeb3ConfigService.operatorAddress);
      expect(signer.privateKey).toEqual(mockWeb3ConfigService.privateKey);
      expect(signer.provider).toBeInstanceOf(JsonRpcProvider);
    });

    test('should throw if invalid chain id provided', () => {
      const invalidChainId = -42;

      expect(() => web3Service.getSigner(invalidChainId)).toThrow(
        `No signer for provided chain id: ${invalidChainId}`,
      );
    });
  });

  describe('calculateTxFees', () => {
    const mockProvider = createMock<Provider>();
    let spyOnGetSigner: Mock<(typeof web3Service)['getSigner']>;

    beforeAll(() => {
      spyOnGetSigner = vi.spyOn(web3Service, 'getSigner').mockImplementation(
        () =>
          ({
            provider: mockProvider,
          }) as unknown as WalletWithProvider,
      );
    });

    afterAll(() => {
      spyOnGetSigner.mockRestore();
    });

    afterEach(() => {
      mockProvider.getFeeData.mockReset();
    });

    test('should use multiplier for transaction fee params', async () => {
      const testChainId = generateTestnetChainId();

      const randomMaxFeePerGas = faker.number.bigInt({ min: 1 });
      const randomMaxPriorityFeePerGas = faker.number.bigInt({ min: 1 });

      mockProvider.getFeeData.mockResolvedValueOnce({
        maxFeePerGas: randomMaxFeePerGas,
        maxPriorityFeePerGas: randomMaxPriorityFeePerGas,
      } as FeeData);

      const feeParams = await web3Service.calculateTxFees(testChainId);

      const feeMultiplier = BigInt(mockWeb3ConfigService.gasPriceMultiplier);
      expect(feeParams).toEqual({
        maxFeePerGas: randomMaxFeePerGas * feeMultiplier,
        maxPriorityFeePerGas: randomMaxPriorityFeePerGas * feeMultiplier,
      });
    });

    test('should throw if no transaction fee data from provider', async () => {
      const testChainId = generateTestnetChainId();

      mockProvider.getFeeData.mockResolvedValueOnce({
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      } as FeeData);

      await expect(web3Service.calculateTxFees(testChainId)).rejects.toThrow(
        `No transaction fee data for chain id: ${testChainId}`,
      );
    });

    test('should fallback to legacy gasPrice data', async () => {
      const testChainId = generateTestnetChainId();
      const randomGasPrice = faker.number.bigInt();

      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: randomGasPrice,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      } as FeeData);

      const fees = await web3Service.calculateTxFees(testChainId);
      const expectedFee =
        randomGasPrice * BigInt(mockWeb3ConfigService.gasPriceMultiplier);

      expect(fees).toEqual({
        maxFeePerGas: expectedFee,
        maxPriorityFeePerGas: expectedFee,
      });
    });
  });
});

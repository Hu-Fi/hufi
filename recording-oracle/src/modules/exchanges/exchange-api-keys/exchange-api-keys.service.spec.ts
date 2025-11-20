import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { EncryptionConfigService } from '@/config';
import { AesEncryptionService } from '@/modules/encryption';
import { mockEncryptionConfigService } from '@/modules/encryption/fixtures';
import { UsersService } from '@/modules/users';

import {
  ExchangeApiClient,
  ExchangeApiClientFactory,
  ExchangePermission,
} from '../api-client';
import { ExchangeApiKeyEntity } from './exchange-api-key.entity';
import {
  ExchangeApiKeyNotFoundError,
  IncompleteKeySuppliedError,
  KeyAuthorizationError,
} from './exchange-api-keys.errors';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeysService } from './exchange-api-keys.service';
import { generateExchangeApiKeysData } from './fixtures';

const mockExchangeApiKeysRepository = createMock<ExchangeApiKeysRepository>();
const mockUsersService = createMock<UsersService>();
const mockExchangeApiClient = createMock<ExchangeApiClient>();

describe('ExchangeApiKeysService', () => {
  let exchangeApiKeysService: ExchangeApiKeysService;
  let aesEncryptionService: AesEncryptionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExchangeApiKeysService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ExchangeApiKeysRepository,
          useValue: mockExchangeApiKeysRepository,
        },
        AesEncryptionService,
        {
          provide: EncryptionConfigService,
          useValue: mockEncryptionConfigService,
        },
        {
          provide: ExchangeApiClientFactory,
          useValue: {
            create: () => mockExchangeApiClient,
          },
        },
      ],
    }).compile();

    exchangeApiKeysService = moduleRef.get<ExchangeApiKeysService>(
      ExchangeApiKeysService,
    );
    aesEncryptionService =
      moduleRef.get<AesEncryptionService>(AesEncryptionService);
  });

  it('should be defined', () => {
    expect(exchangeApiKeysService).toBeDefined();
  });

  describe('enroll', () => {
    it.each([
      Object.assign(generateExchangeApiKeysData(), { userId: '' }),
      Object.assign(generateExchangeApiKeysData(), { apiKey: '' }),
      Object.assign(generateExchangeApiKeysData(), { secretKey: '' }),
    ])('should throw if required param is missing [%#]', async (input) => {
      let thrownError;
      try {
        await exchangeApiKeysService.enroll(input);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError.constructor).toBe(Error);
      expect(thrownError.message).toBe('Invalid arguments');
    });

    it('should throw if not supported exchange name provided', async () => {
      const input = generateExchangeApiKeysData();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input.exchangeName = input.exchangeName.toUpperCase() as any;

      let thrownError;
      try {
        await exchangeApiKeysService.enroll(input);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError.constructor).toBe(Error);
      expect(thrownError.message).toBe('Exchange name is not valid');
    });

    it('should throw if provided credentials not complete', async () => {
      mockExchangeApiClient.checkRequiredCredentials.mockReturnValueOnce(false);

      const input = generateExchangeApiKeysData();

      let thrownError;
      try {
        await exchangeApiKeysService.enroll(input);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(IncompleteKeySuppliedError);
      expect(thrownError.exchangeName).toBe(input.exchangeName);
    });

    it('should throw if provided keys do not have required access', async () => {
      mockExchangeApiClient.checkRequiredCredentials.mockReturnValueOnce(true);

      const missingPermissions = faker.helpers.arrayElements(
        Object.values(ExchangePermission),
        faker.number.int({ min: 1, max: 3 }),
      );
      mockExchangeApiClient.checkRequiredAccess.mockResolvedValueOnce({
        success: false,
        missing: missingPermissions,
      });

      const input = generateExchangeApiKeysData();

      let thrownError;
      try {
        await exchangeApiKeysService.enroll(input);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(KeyAuthorizationError);
      expect(thrownError.exchangeName).toBe(input.exchangeName);
      expect(thrownError.missingPermissions).toBe(missingPermissions);
    });

    it('should rethrow if user not exists', async () => {
      mockExchangeApiClient.checkRequiredCredentials.mockReturnValueOnce(true);
      mockExchangeApiClient.checkRequiredAccess.mockResolvedValueOnce({
        success: true,
      });

      const testError = new Error('Synthetic user not exist');
      mockUsersService.assertUserExistsById.mockRejectedValueOnce(testError);

      const input = generateExchangeApiKeysData();

      let thrownError;
      try {
        await exchangeApiKeysService.enroll(input);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toEqual(testError);
    });

    it('should upsert encrypted keys if data is valid', async () => {
      mockExchangeApiClient.checkRequiredCredentials.mockReturnValueOnce(true);
      mockExchangeApiClient.checkRequiredAccess.mockResolvedValueOnce({
        success: true,
      });

      const input = generateExchangeApiKeysData();

      const entity = await exchangeApiKeysService.enroll(input);

      expect(entity.userId).toBe(input.userId);
      expect(entity.exchangeName).toBe(input.exchangeName);
      expect(entity.apiKey).not.toBe(input.apiKey);
      expect(entity.secretKey).not.toBe(input.secretKey);

      const [decryptedApiKey, decryptedSecretKey] = await Promise.all([
        aesEncryptionService.decrypt(entity.apiKey),
        aesEncryptionService.decrypt(entity.secretKey),
      ]);

      expect(decryptedApiKey.toString()).toBe(input.apiKey);
      expect(decryptedSecretKey.toString()).toBe(input.secretKey);
    });
  });

  describe('retrieve', () => {
    it('should throw if key not found for the user', async () => {
      const { userId, exchangeName } = generateExchangeApiKeysData();
      mockExchangeApiKeysRepository.findOneByUserAndExchange.mockResolvedValueOnce(
        null,
      );

      let thrownError;
      try {
        await exchangeApiKeysService.retrieve(userId, exchangeName);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(ExchangeApiKeyNotFoundError);
      expect(thrownError.userId).toBe(userId);
      expect(thrownError.exchangeName).toBe(exchangeName);
    });

    it('should return decrypted keys', async () => {
      const { userId, exchangeName, apiKey, secretKey } =
        generateExchangeApiKeysData();

      const [encryptedApiKey, encryptedSecretKey] = await Promise.all([
        aesEncryptionService.encrypt(Buffer.from(apiKey)),
        aesEncryptionService.encrypt(Buffer.from(secretKey)),
      ]);
      mockExchangeApiKeysRepository.findOneByUserAndExchange.mockResolvedValueOnce(
        {
          apiKey: encryptedApiKey,
          secretKey: encryptedSecretKey,
        } as ExchangeApiKeyEntity,
      );

      const result = await exchangeApiKeysService.retrieve(
        userId,
        exchangeName,
      );

      expect(result.apiKey).toBe(apiKey);
      expect(result.secretKey).toBe(secretKey);
      expect(
        mockExchangeApiKeysRepository.findOneByUserAndExchange,
      ).toHaveBeenCalledWith(userId, exchangeName);
    });
  });

  describe('retrieveEnrolledApiKeys', () => {
    it('should return enrolled keys', async () => {
      const { userId, exchangeName, apiKey, secretKey } =
        generateExchangeApiKeysData();

      const [encryptedApiKey, encryptedSecretKey] = await Promise.all([
        aesEncryptionService.encrypt(Buffer.from(apiKey)),
        aesEncryptionService.encrypt(Buffer.from(secretKey)),
      ]);
      mockExchangeApiKeysRepository.findByUserId.mockResolvedValueOnce([
        {
          exchangeName,
          apiKey: encryptedApiKey,
          secretKey: encryptedSecretKey,
        },
      ] as ExchangeApiKeyEntity[]);

      const results =
        await exchangeApiKeysService.retrieveEnrolledApiKeys(userId);

      expect(results.length).toBe(1);

      const enrolledApiKey = results[0];
      expect(enrolledApiKey.exchangeName).toBe(exchangeName);
      expect(enrolledApiKey.apiKey).toBe(apiKey);

      expect(mockExchangeApiKeysRepository.findByUserId).toHaveBeenCalledWith(
        userId,
      );
    });
  });
});

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
  KeyAuthorizationError,
} from './exchange-api-keys.errors';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeysService } from './exchange-api-keys.service';
import {
  generateExchangeApiKey,
  generateExchangeApiKeysData,
} from './fixtures';

const mockExchangeApiKeysRepository = createMock<ExchangeApiKeysRepository>();
const mockUsersService = createMock<UsersService>();
const mockExchangeApiClient = createMock<ExchangeApiClient>();

const exchangePermissions = Object.values(ExchangePermission);

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

    it('should throw if provided keys do not have required access', async () => {
      mockExchangeApiClient.checkRequiredCredentials.mockReturnValueOnce(true);

      const missingPermissions = faker.helpers.arrayElements(
        exchangePermissions,
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

    it('should upsert encrypted keys if data is valid and extras not provided', async () => {
      mockExchangeApiClient.checkRequiredCredentials.mockReturnValueOnce(true);
      mockExchangeApiClient.checkRequiredAccess.mockResolvedValueOnce({
        success: true,
      });

      const input = generateExchangeApiKeysData();
      delete input.extras;

      const entity = await exchangeApiKeysService.enroll(input);

      expect(entity).toEqual({
        userId: input.userId,
        exchangeName: input.exchangeName,
        apiKey: expect.any(String),
        secretKey: expect.any(String),
        extras: null,
        isValid: true,
        missingPermissions: [],
        updatedAt: expect.any(Date),
      });

      const [decryptedApiKey, decryptedSecretKey] = await Promise.all([
        aesEncryptionService.decrypt(entity.apiKey),
        aesEncryptionService.decrypt(entity.secretKey),
      ]);

      expect(decryptedApiKey.toString()).toBe(input.apiKey);
      expect(decryptedSecretKey.toString()).toBe(input.secretKey);
    });

    it('should upsert encrypted keys if data is valid and extras provided', async () => {
      mockExchangeApiClient.checkRequiredCredentials.mockReturnValueOnce(true);
      mockExchangeApiClient.checkRequiredAccess.mockResolvedValueOnce({
        success: true,
      });

      const input = generateExchangeApiKeysData();
      input.extras = {
        [faker.string.alpha()]: faker.string.sample(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const entity = await exchangeApiKeysService.enroll(input);

      expect(entity).toEqual({
        userId: input.userId,
        exchangeName: input.exchangeName,
        apiKey: expect.any(String),
        secretKey: expect.any(String),
        extras: input.extras,
        isValid: true,
        missingPermissions: [],
        updatedAt: expect.any(Date),
      });

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
      const { userId, exchangeName, apiKey, secretKey, extras } =
        generateExchangeApiKeysData();

      const [encryptedApiKey, encryptedSecretKey] = await Promise.all([
        aesEncryptionService.encrypt(Buffer.from(apiKey)),
        aesEncryptionService.encrypt(Buffer.from(secretKey)),
      ]);

      const mockedExchangeApiKey = generateExchangeApiKey(
        {
          encryptedApiKey,
          encryptedSecretKey,
        },
        {
          userId,
          exchangeName,
          extras,
        },
      );
      mockExchangeApiKeysRepository.findOneByUserAndExchange.mockResolvedValueOnce(
        mockedExchangeApiKey,
      );

      const result = await exchangeApiKeysService.retrieve(
        userId,
        exchangeName,
      );

      expect(result.apiKey).toBe(apiKey);
      expect(result.secretKey).toBe(secretKey);
      expect(result.extras).toEqual(extras);
      expect(
        mockExchangeApiKeysRepository.findOneByUserAndExchange,
      ).toHaveBeenCalledWith(userId, exchangeName);
    });
  });

  describe('retrieveEnrolledApiKeys', () => {
    it('should return enrolled keys', async () => {
      const { userId, exchangeName, apiKey, secretKey, extras } =
        generateExchangeApiKeysData();

      const [encryptedApiKey, encryptedSecretKey] = await Promise.all([
        aesEncryptionService.encrypt(Buffer.from(apiKey)),
        aesEncryptionService.encrypt(Buffer.from(secretKey)),
      ]);
      const mockedExchangeApiKey = generateExchangeApiKey(
        {
          encryptedApiKey,
          encryptedSecretKey,
        },
        {
          userId,
          exchangeName,
          extras,
        },
      );
      mockExchangeApiKeysRepository.findByUserId.mockResolvedValueOnce([
        mockedExchangeApiKey,
      ]);

      const results =
        await exchangeApiKeysService.retrieveEnrolledApiKeys(userId);

      expect(results.length).toBe(1);

      const enrolledApiKey = results[0];
      expect(enrolledApiKey.exchangeName).toBe(exchangeName);
      expect(enrolledApiKey.apiKey).toBe(apiKey);
      expect(enrolledApiKey.extras).toEqual(extras);

      expect(mockExchangeApiKeysRepository.findByUserId).toHaveBeenCalledWith(
        userId,
      );
    });
  });

  describe('markAsInvalid', () => {
    let userId: string;
    let exchangeName: string;

    beforeAll(() => {
      userId = faker.string.uuid();
      exchangeName = faker.lorem.slug();
    });

    it('should throw if no missing permissions', async () => {
      let thrownError;

      try {
        await exchangeApiKeysService.markAsInvalid(userId, exchangeName, []);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'At least one missing permission must be provided',
      );

      expect(mockExchangeApiKeysRepository.save).toHaveBeenCalledTimes(0);
    });

    it('should throw if key not found', async () => {
      mockExchangeApiKeysRepository.findOneByUserAndExchange.mockResolvedValueOnce(
        null,
      );
      let thrownError;

      try {
        await exchangeApiKeysService.markAsInvalid(
          userId,
          exchangeName,
          faker.helpers.arrayElements(exchangePermissions),
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(ExchangeApiKeyNotFoundError);
      expect(thrownError.userId).toBe(userId);
      expect(thrownError.exchangeName).toBe(exchangeName);

      expect(
        mockExchangeApiKeysRepository.findOneByUserAndExchange,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockExchangeApiKeysRepository.findOneByUserAndExchange,
      ).toHaveBeenCalledWith(userId, exchangeName);

      expect(mockExchangeApiKeysRepository.save).toHaveBeenCalledTimes(0);
    });

    it('should mark existing key as invalid', async () => {
      const apiKeyEntity = generateExchangeApiKey({
        encryptedApiKey: faker.string.hexadecimal(),
        encryptedSecretKey: faker.string.hexadecimal(),
      });
      mockExchangeApiKeysRepository.findOneByUserAndExchange.mockResolvedValueOnce(
        { ...apiKeyEntity } as ExchangeApiKeyEntity,
      );

      const missingPermissions =
        faker.helpers.arrayElements(exchangePermissions);
      await exchangeApiKeysService.markAsInvalid(
        userId,
        exchangeName,
        missingPermissions,
      );

      expect(mockExchangeApiKeysRepository.save).toHaveBeenCalledTimes(1);
      expect(mockExchangeApiKeysRepository.save).toHaveBeenCalledWith({
        ...apiKeyEntity,
        isValid: false,
        missingPermissions,
      });
    });

    it('should override missing permissions with new values', async () => {
      const apiKeyEntity = generateExchangeApiKey({
        encryptedApiKey: faker.string.hexadecimal(),
        encryptedSecretKey: faker.string.hexadecimal(),
      });
      apiKeyEntity.isValid = false;
      apiKeyEntity.missingPermissions = exchangePermissions;
      mockExchangeApiKeysRepository.findOneByUserAndExchange.mockResolvedValueOnce(
        { ...apiKeyEntity } as ExchangeApiKeyEntity,
      );

      const missingPermissions = faker.helpers.arrayElements(
        exchangePermissions,
        {
          min: 1,
          max: 2,
        },
      );
      await exchangeApiKeysService.markAsInvalid(
        userId,
        exchangeName,
        missingPermissions,
      );

      expect(mockExchangeApiKeysRepository.save).toHaveBeenCalledTimes(1);
      expect(mockExchangeApiKeysRepository.save).toHaveBeenCalledWith({
        ...apiKeyEntity,
        isValid: false,
        missingPermissions,
      });
    });

    it('should save missing permissions w/o duplicates', async () => {
      const apiKeyEntity = generateExchangeApiKey({
        encryptedApiKey: faker.string.hexadecimal(),
        encryptedSecretKey: faker.string.hexadecimal(),
      });
      mockExchangeApiKeysRepository.findOneByUserAndExchange.mockResolvedValueOnce(
        { ...apiKeyEntity } as ExchangeApiKeyEntity,
      );

      const missingPermissions =
        faker.helpers.arrayElements(exchangePermissions);
      await exchangeApiKeysService.markAsInvalid(userId, exchangeName, [
        ...missingPermissions,
        ...missingPermissions,
      ]);

      expect(mockExchangeApiKeysRepository.save).toHaveBeenCalledTimes(1);
      expect(mockExchangeApiKeysRepository.save).toHaveBeenCalledWith({
        ...apiKeyEntity,
        isValid: false,
        missingPermissions,
      });
    });
  });
});

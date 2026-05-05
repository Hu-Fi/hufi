import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-vitest';
import { Test } from '@nestjs/testing';
import { ethers } from 'ethers';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import { InvalidEvmAddressError } from '@/common/errors/web3';
import { isUuidV4, isValidNonce } from '@/common/validators';
import { generateInvalidEvmAddress } from '~/test/fixtures/web3';

import { generateUserEntity } from './fixtures';
import { UserNotFoundError } from './users.errors';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

const mockUsersRepository = createMock<UsersRepository>();

describe('UsersService', () => {
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    usersService = moduleRef.get<UsersService>(UsersService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('create', () => {
    test('should throw when invalid address provided', async () => {
      let thrownError: any;
      try {
        await usersService.create(generateInvalidEvmAddress());
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidEvmAddressError);
    });

    test('should create user with correct data', async () => {
      const now = Date.now();
      vi.useFakeTimers({ now });

      const randomAddress = faker.finance.ethereumAddress();

      const user = await usersService.create(randomAddress);

      vi.useRealTimers();

      expect(isUuidV4(user.id)).toBe(true);

      expect(isValidNonce(user.nonce)).toBe(true);

      const checksummedAddress = ethers.getAddress(randomAddress);
      expect(user.evmAddress).toBe(checksummedAddress);

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.createdAt.valueOf()).toBe(now);
      expect(user.updatedAt).toEqual(user.createdAt);
    });
  });

  describe('findOneByEvmAddress', () => {
    test('should throw when invalid address provided', async () => {
      let thrownError: any;
      try {
        await usersService.findOneByEvmAddress(generateInvalidEvmAddress());
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidEvmAddressError);
    });

    test('should find user for non-checksummed address', async () => {
      const user = generateUserEntity();
      mockUsersRepository.findOneByEvmAddress.mockResolvedValueOnce(user);

      const result = await usersService.findOneByEvmAddress(
        user.evmAddress.toLowerCase(),
      );

      expect(result).toEqual(user);
      expect(mockUsersRepository.findOneByEvmAddress).toHaveBeenCalledWith(
        user.evmAddress,
      );
    });
  });

  describe('getNonce', () => {
    test('should throw when invalid address provided', async () => {
      let thrownError: any;
      try {
        await usersService.getNonce(generateInvalidEvmAddress());
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidEvmAddressError);
    });

    test('should return default nonce if user does not exist', async () => {
      mockUsersRepository.findOneByEvmAddress.mockResolvedValue(null);

      const nonce = await usersService.getNonce(
        faker.finance.ethereumAddress(),
      );

      expect(nonce).toBe('signup');
    });

    test("should return user's nonce", async () => {
      const user = generateUserEntity();
      mockUsersRepository.findOneByEvmAddress.mockResolvedValueOnce(user);

      const nonce = await usersService.getNonce(user.evmAddress.toLowerCase());

      expect(mockUsersRepository.findOneByEvmAddress).toHaveBeenCalledWith(
        user.evmAddress,
      );
      expect(nonce).toBe(user.nonce);
    });
  });

  describe('assertUserExistsById', () => {
    test('should throw when used does not exist for provided id', async () => {
      mockUsersRepository.existsById.mockResolvedValueOnce(false);
      const testUserId = faker.string.uuid();

      let thrownError: any;
      try {
        await usersService.assertUserExistsById(testUserId);
      } catch (error) {
        thrownError = error;
      }

      expect(mockUsersRepository.existsById).toHaveBeenCalledWith(testUserId);
      expect(thrownError).toBeInstanceOf(UserNotFoundError);
    });

    test('should not throw when user exists for provided id', async () => {
      mockUsersRepository.existsById.mockResolvedValueOnce(true);
      const testUserId = faker.string.uuid();

      await usersService.assertUserExistsById(testUserId);

      expect(mockUsersRepository.existsById).toHaveBeenCalledTimes(1);
      expect(mockUsersRepository.existsById).toHaveBeenCalledWith(testUserId);
    });
  });
});

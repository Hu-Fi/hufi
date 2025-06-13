jest.mock('@/logger');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { DEFAULT_NONCE } from '@/common/constants';
import { isUuidV4, isValidNonce } from '@/common/validators';
import { AuthConfigService } from '@/config';
import logger from '@/logger';
import { UsersRepository, UsersService } from '@/modules/users';
import { generateUserEntity } from '@/modules/users/fixtures';
import * as web3Utils from '@/utils/web3';
import { generateES256Keys } from '~/test/fixtures/crypto';
import { generateEthWallet } from '~/test/fixtures/web3';

import { AuthError, AuthErrorMessage } from './auth.errors';
import { AuthService } from './auth.service';
import { RefreshTokenEntity } from './refresh-token.entity';
import { RefreshTokensRepository } from './refresh-tokens.repository';

const { publicKey, privateKey } = generateES256Keys();
const mockAuthConfigService: Omit<AuthConfigService, 'configService'> = {
  jwtPrivateKey: privateKey,
  jwtPublicKey: publicKey,
  accessTokenExpiresIn: 600,
  refreshTokenExpiresIn: 3600000,
};

const mockRefresTokenRepository = createMock<RefreshTokensRepository>();
const mockUsersRepository = createMock<UsersRepository>();
const mockUsersService = createMock<UsersService>();

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.registerAsync({
          useFactory: () => ({
            privateKey,
            signOptions: {
              algorithm: 'ES256',
              expiresIn: mockAuthConfigService.accessTokenExpiresIn,
            },
          }),
        }),
      ],
      providers: [
        { provide: AuthConfigService, useValue: mockAuthConfigService },
        AuthService,
        {
          provide: RefreshTokensRepository,
          useValue: mockRefresTokenRepository,
        },
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    jwtService = moduleRef.get<JwtService>(JwtService);
  });

  beforeEach(() => {
    mockRefresTokenRepository.insert.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (entity: RefreshTokenEntity): Promise<any> => {
        if (!entity.id) {
          entity.id = faker.string.uuid();
        }
      },
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('generateTokens', () => {
    it.each([
      null,
      { uuid: faker.string.uuid() } as unknown as RefreshTokenEntity,
    ])(
      'should generate access and refresh tokens for worker [%#]',
      async (existingRefreshToken) => {
        const now = Date.now();
        const user = generateUserEntity();

        mockRefresTokenRepository.findOneByUserId.mockResolvedValueOnce(
          existingRefreshToken,
        );

        const { accessToken, refreshToken } =
          await authService.generateTokens(user);

        if (existingRefreshToken) {
          expect(mockRefresTokenRepository.remove).toHaveBeenCalledTimes(1);
          expect(mockRefresTokenRepository.remove).toHaveBeenCalledWith(
            existingRefreshToken,
          );
        }

        const decodedAccessToken = await jwtService.verifyAsync(accessToken, {
          secret: mockAuthConfigService.jwtPrivateKey,
        });

        expect(decodedAccessToken.exp).toBeGreaterThanOrEqual(
          Math.floor(now / 1000) + mockAuthConfigService.accessTokenExpiresIn,
        );

        const jwtPayload = {
          ...decodedAccessToken,
          iat: undefined,
          exp: undefined,
        };

        expect(jwtPayload).toEqual({
          user_id: user.id,
          wallet_address: user.evmAddress,
        });

        expect(isUuidV4(refreshToken)).toBe(true);
      },
    );
  });

  describe('auth', () => {
    let spyOnGenerateTokens: jest.SpyInstance;

    beforeAll(() => {
      spyOnGenerateTokens = jest.spyOn(authService, 'generateTokens');
    });

    afterAll(() => {
      spyOnGenerateTokens.mockRestore();
    });

    it('should throw if invalid signup signature', async () => {
      mockUsersService.findOneByEvmAddress.mockResolvedValueOnce(null);

      const ethWallet = generateEthWallet();
      const abuseAddress = faker.finance.ethereumAddress();

      const signature = await web3Utils.signMessage(
        { nonce: DEFAULT_NONCE },
        ethWallet.privateKey,
      );

      let thrownError;
      try {
        await authService.auth(signature, abuseAddress);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(AuthError);
      expect(thrownError.message).toBe(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    });

    it('should throw if invalid signature for user', async () => {
      const user = generateUserEntity();
      mockUsersService.findOneByEvmAddress.mockResolvedValueOnce(user);

      const ethWallet = generateEthWallet();

      const signature = await web3Utils.signMessage(
        { nonce: user.nonce },
        ethWallet.privateKey,
      );

      let thrownError;
      try {
        await authService.auth(signature, user.evmAddress);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(AuthError);
      expect(thrownError.message).toBe(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    });

    it('should update nonce for existing user and authorize it', async () => {
      const ethWallet = generateEthWallet();
      const user = generateUserEntity({ evmAddress: ethWallet.address });

      mockUsersService.findOneByEvmAddress.mockResolvedValueOnce(user);

      const mockAuthTokens = {
        accessToken: faker.string.sample(),
        refreshToken: faker.string.sample(),
      };
      spyOnGenerateTokens.mockResolvedValueOnce(mockAuthTokens);

      const signature = await web3Utils.signMessage(
        { nonce: user.nonce },
        ethWallet.privateKey,
      );

      const result = await authService.auth(signature, user.evmAddress);

      expect(result).toEqual(mockAuthTokens);

      expect(mockUsersService.create).toHaveBeenCalledTimes(0);
      expect(mockUsersRepository.updateOneById).toHaveBeenCalledTimes(1);

      const [userIdParam, updateOptionsParam] =
        mockUsersRepository.updateOneById.mock.calls[0];

      expect(userIdParam).toBe(user.id);

      const updatedNonce = updateOptionsParam.nonce;
      expect(updateOptionsParam).toEqual({ nonce: updatedNonce });
      expect(isValidNonce(updatedNonce)).toBe(true);

      expect(spyOnGenerateTokens).toHaveBeenCalledWith(user);
    });

    it('should create new user when not exist and authorize it', async () => {
      mockUsersService.findOneByEvmAddress.mockResolvedValueOnce(null);

      const ethWallet = generateEthWallet();
      const user = generateUserEntity({ evmAddress: ethWallet.address });

      mockUsersService.create.mockResolvedValueOnce(user);

      const mockAuthTokens = {
        accessToken: faker.string.sample(),
        refreshToken: faker.string.sample(),
      };
      spyOnGenerateTokens.mockResolvedValueOnce(mockAuthTokens);

      const signature = await web3Utils.signMessage(
        { nonce: DEFAULT_NONCE },
        ethWallet.privateKey,
      );

      const result = await authService.auth(signature, user.evmAddress);

      expect(result).toEqual(mockAuthTokens);

      expect(mockUsersRepository.updateOneById).toHaveBeenCalledTimes(0);

      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
      expect(mockUsersService.create).toHaveBeenCalledWith(user.evmAddress);
      expect(spyOnGenerateTokens).toHaveBeenCalledWith(user);
    });
  });

  describe('refresh', () => {
    let refreshToken: string;

    beforeEach(() => {
      refreshToken = faker.string.uuid();
    });

    it('should throw when token not found', async () => {
      mockRefresTokenRepository.findOneById.mockResolvedValueOnce(null);

      let thrownError;
      try {
        await authService.refresh(refreshToken);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(AuthError);
      expect(thrownError.message).toBe(AuthErrorMessage.INVALID_REFRESH_TOKEN);
    });

    it('should throw when token expired', async () => {
      mockRefresTokenRepository.findOneById.mockResolvedValueOnce({
        id: refreshToken,
        expiresAt: faker.date.past(),
      } as RefreshTokenEntity);

      let thrownError;
      try {
        await authService.refresh(refreshToken);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(AuthError);
      expect(thrownError.message).toBe(AuthErrorMessage.REFRESH_TOKEN_EXPIRED);
    });

    it('should throw when user relation is broken and log it', async () => {
      const refreshTokenEntity = {
        id: refreshToken,
        userId: faker.string.uuid(),
        expiresAt: faker.date.future(),
      };

      mockRefresTokenRepository.findOneById.mockResolvedValueOnce(
        refreshTokenEntity,
      );

      let thrownError;
      try {
        await authService.refresh(refreshToken);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError.constructor).toBe(Error);
      expect(thrownError.message).toBe(AuthErrorMessage.INVALID_REFRESH_TOKEN);

      expect(logger.error).toHaveBeenCalledWith(
        'Related user is missing for refresh token',
        {
          refreshToken: refreshTokenEntity.id,
          userId: refreshTokenEntity.userId,
        },
      );
    });

    it('should refresh tokens', async () => {
      const spyOnGenerateTokens = jest.spyOn(authService, 'generateTokens');

      const user = generateUserEntity();
      const refreshTokenEntity = {
        id: refreshToken,
        user,
        userId: user.id,
        expiresAt: faker.date.future(),
      };

      mockRefresTokenRepository.findOneById.mockResolvedValueOnce(
        refreshTokenEntity,
      );

      const mockAuthTokens = {
        accessToken: faker.string.sample(),
        refreshToken: faker.string.sample(),
      };
      spyOnGenerateTokens.mockResolvedValueOnce(mockAuthTokens);

      const result = await authService.refresh(refreshToken);

      expect(result).toEqual(mockAuthTokens);

      expect(mockRefresTokenRepository.findOneById).toHaveBeenCalledWith(
        refreshToken,
        {
          relations: { user: true },
        },
      );

      expect(spyOnGenerateTokens).toHaveBeenCalledWith(user);

      spyOnGenerateTokens.mockRestore();
    });
  });
});

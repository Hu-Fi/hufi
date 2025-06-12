import { createMock } from '@golevelup/ts-jest';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { AuthConfigService } from '@/config';
import { UsersRepository, UsersService } from '@/modules/users';
import { generateES256Keys } from '~/test/fixtures/crypto';

import { AuthService } from './auth.service';
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
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
});

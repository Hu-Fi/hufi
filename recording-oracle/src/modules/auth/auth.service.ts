import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { DEFAULT_NONCE } from '@/common/constants';
import { AuthConfigService } from '@/config';
import logger from '@/logger';
import { UserEntity, UsersRepository, UsersService } from '@/modules/users';
import * as web3Utils from '@/common/utils/web3';

import { AuthError, AuthErrorMessage } from './auth.errors';
import { RefreshTokenEntity } from './refresh-token.entity';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import type { AuthTokens } from './types';

@Injectable()
export class AuthService {
  private readonly logger = logger.child({
    context: AuthService.name,
  });
  constructor(
    private readonly authConfigService: AuthConfigService,
    private readonly jwtService: JwtService,

    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {}

  async auth(
    signature: string,
    address: string,
  ): Promise<AuthTokens | undefined> {
    let signedData;
    let user = await this.usersService.findOneByEvmAddress(address);

    if (!user) {
      signedData = { nonce: DEFAULT_NONCE };
    } else {
      signedData = { nonce: user.nonce };
    }

    const isValidSignature = web3Utils.verifySignature(signedData, signature, [
      address,
    ]);

    if (!isValidSignature) {
      throw new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    }

    if (user) {
      const nonce = web3Utils.generateNonce();
      await this.usersRepository.updateOneById(user.id, { nonce });
    } else {
      user = await this.usersService.create(address);
    }

    return this.generateTokens(user);
  }

  async generateTokens(user: UserEntity): Promise<AuthTokens> {
    const refreshTokenEntity =
      await this.refreshTokensRepository.findOneByUserId(user.id);

    if (refreshTokenEntity) {
      await this.refreshTokensRepository.remove(refreshTokenEntity);
    }

    const newRefreshTokenEntity = new RefreshTokenEntity();
    newRefreshTokenEntity.userId = user.id;
    const date = new Date();
    newRefreshTokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.refreshTokenExpiresIn,
    );

    await this.refreshTokensRepository.insert(newRefreshTokenEntity);

    const jwtPayload = {
      user_id: user.id,
      wallet_address: user.evmAddress,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload);

    return { accessToken, refreshToken: newRefreshTokenEntity.id };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenEntity = await this.refreshTokensRepository.findOneById(
      refreshToken,
      {
        relations: {
          user: true,
        },
      },
    );

    if (!tokenEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_REFRESH_TOKEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new AuthError(AuthErrorMessage.REFRESH_TOKEN_EXPIRED);
    }

    if (!tokenEntity.user) {
      this.logger.error('Related user is missing for refresh token', {
        refreshToken: tokenEntity.id,
        userId: tokenEntity.userId,
      });
      /**
       * This should never happen, just a safety-belt,
       * so throw it as unexpected error.
       */
      throw new Error(AuthErrorMessage.INVALID_REFRESH_TOKEN);
    }

    return this.generateTokens(tokenEntity.user);
  }
}

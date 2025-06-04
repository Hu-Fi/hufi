import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthConfigService } from '../../config';
import logger from '../../logger';
import * as web3Utils from '../../utils/web3';
import { UserEntity, UsersRepository, UsersService } from '../users';
import { AuthError, AuthErrorMessage } from './auth.error';
import { RefreshTokenEntity } from './token.entity';
import { TokenRepository } from './token.repository';
import type { AuthTokens } from './types';
import { DEFAULT_NONCE } from '../../common/constants';

@Injectable()
export class AuthService {
  private readonly logger = logger.child({
    context: AuthService.name,
  });
  constructor(
    private readonly authConfigService: AuthConfigService,
    private readonly jwtService: JwtService,

    private readonly tokenRepository: TokenRepository,
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {}

  async auth(
    signature: string,
    address: string,
  ): Promise<AuthTokens | undefined> {
    let signedData;
    let user = await this.usersRepository.findOneByEvmAddress(address);

    if (!user) {
      signedData = { nonce: DEFAULT_NONCE };
    } else {
      signedData = { nonce: user.nonce };
    }

    logger.info(JSON.stringify(signedData));
    const isValidSignature = web3Utils.verifySignature(signedData, signature, [
      address,
    ]);

    if (!isValidSignature) {
      throw new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    }

    if (user) {
      const nonce = web3Utils.generateNonce();
      await this.usersRepository.updateOneById(user.id, { nonce });

      return this.generateTokens(user);
    }

    if (!user) {
      user = await this.usersService.create(address);
      return this.generateTokens(user);
    }
  }

  async generateTokens(user: UserEntity): Promise<AuthTokens> {
    const refreshTokenEntity = await this.tokenRepository.findOneByUserId(
      user.id,
    );

    if (refreshTokenEntity) {
      await this.tokenRepository.remove(refreshTokenEntity);
    }

    const newRefreshTokenEntity = new RefreshTokenEntity();
    newRefreshTokenEntity.userId = user.id;
    const date = new Date();
    newRefreshTokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.refreshTokenExpiresIn,
    );

    await this.tokenRepository.insert(newRefreshTokenEntity);

    const jwtPayload = {
      user_id: user.id,
      wallet_address: user.evmAddress,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: this.authConfigService.accessTokenExpiresIn,
    });

    return { accessToken, refreshToken: newRefreshTokenEntity.id };
  }
}

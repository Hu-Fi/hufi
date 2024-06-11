import { createHash } from 'crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthConfigService } from '../../common/config/auth-config.service';
import { ErrorAuth } from '../../common/constants/errors';
import { TokenType } from '../../common/enums/token';
import { SignatureType } from '../../common/enums/web3';
import { ControlledError } from '../../common/errors/controlled';
import { verifySignature } from '../../common/utils/signature';
import { UserEntity, TokenEntity } from '../../database/entities';
import { UserService } from '../user/user.service';

import {
  AuthDto,
  RefreshTokenDto,
  Web3SignInDto,
  Web3SignUpDto,
} from './auth.dto';
import { TokenRepository } from './token.repository';

@Injectable()
export class AuthService {
  private readonly salt: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly authConfigService: AuthConfigService,
  ) {}

  public async auth(userEntity: UserEntity): Promise<AuthDto> {
    const refreshTokenEntity =
      await this.tokenRepository.findOneByUserIdAndType(
        userEntity.id,
        TokenType.REFRESH,
      );

    const accessToken = await this.jwtService.signAsync(
      {
        userId: userEntity.id,
        address: userEntity.evmAddress,
      },
      {
        expiresIn: this.authConfigService.accessTokenExpiresIn,
      },
    );

    if (refreshTokenEntity) {
      await this.tokenRepository.deleteOne(refreshTokenEntity);
    }

    const newRefreshTokenEntity = new TokenEntity();
    newRefreshTokenEntity.user = userEntity;
    newRefreshTokenEntity.type = TokenType.REFRESH;
    const date = new Date();
    newRefreshTokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.refreshTokenExpiresIn * 1000,
    );

    await this.tokenRepository.createUnique(newRefreshTokenEntity);

    return { accessToken, refreshToken: newRefreshTokenEntity.id };
  }

  public async refreshToken(data: RefreshTokenDto): Promise<AuthDto> {
    const tokenEntity = await this.tokenRepository.findOneById(
      data.refreshToken,
    );

    if (!tokenEntity) {
      throw new ControlledError(ErrorAuth.InvalidToken, HttpStatus.FORBIDDEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new ControlledError(ErrorAuth.TokenExpired, HttpStatus.FORBIDDEN);
    }

    return this.auth(tokenEntity.user);
  }

  public async web3Signup(data: Web3SignUpDto): Promise<AuthDto> {
    const preSignUpData = await this.userService.prepareSignatureBody(
      SignatureType.SIGNUP,
      data.address,
    );

    const verified = verifySignature(preSignUpData, data.signature, [
      data.address,
    ]);

    if (!verified) {
      throw new ControlledError(
        ErrorAuth.InvalidSignature,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userEntity = await this.userService.createWeb3User(data.address);

    return this.auth(userEntity);
  }

  public async web3Signin(data: Web3SignInDto): Promise<AuthDto> {
    const userEntity = await this.userService.getByAddress(data.address);

    const verified = verifySignature(
      await this.userService.prepareSignatureBody(
        SignatureType.SIGNIN,
        data.address,
      ),
      data.signature,
      [data.address],
    );

    if (!verified) {
      throw new ControlledError(
        ErrorAuth.InvalidSignature,
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.userService.updateNonce(userEntity);

    return this.auth(userEntity);
  }

  public hashToken(token: string): string {
    const hash = createHash('sha256');
    hash.update(token + this.salt);
    return hash.digest('hex');
  }

  public compareToken(token: string, hashedToken: string): boolean {
    return this.hashToken(token) === hashedToken;
  }
}

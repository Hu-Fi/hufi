import { createHash } from 'crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthConfigService } from '../../common/config/auth-config.service';
import { ErrorAuth } from '../../common/constants/errors';
import { TokenType } from '../../common/enums/token';
import { SignatureType } from '../../common/enums/web3';
import { ControlledError } from '../../common/errors/controlled';
import { verifySignature } from '../../common/utils/signature';
import { TokenEntity, UserEntity } from '../../database/entities';
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
    private readonly jwt: JwtService,
    private readonly users: UserService,
    private readonly tokens: TokenRepository,
    authCfg: AuthConfigService,
  ) {
    this.salt = authCfg.tokenSalt;
  }

  private async issueTokens(user: UserEntity): Promise<AuthDto> {
    // Create fresh refresh‑token row
    await this.tokens.deleteOneByUserIdAndType(user.id, TokenType.REFRESH);

    const refresh = new TokenEntity();
    refresh.user = user;
    refresh.type = TokenType.REFRESH;
    refresh.expiresAt = new Date(Date.now() + authExpiry.refresh * 1_000);

    await this.tokens.createUnique(refresh); // <- await!

    const accessToken = await this.jwt.signAsync({
      userId: user.id,
      address: user.evmAddress,
    });

    return { accessToken, refreshToken: refresh.id };
  }

  auth(user: UserEntity): Promise<AuthDto> {
    return this.issueTokens(user);
  }

  /** POST /auth/refresh‑token */
  async refreshToken({ refreshToken }: RefreshTokenDto): Promise<AuthDto> {
    const token = await this.tokens.findOneById(refreshToken);
    if (!token) {
      throw new ControlledError(ErrorAuth.InvalidToken, HttpStatus.FORBIDDEN);
    }
    if (token.expiresAt < new Date()) {
      throw new ControlledError(ErrorAuth.TokenExpired, HttpStatus.FORBIDDEN);
    }
    return this.issueTokens(token.user);
  }

  async web3Signup(dto: Web3SignUpDto): Promise<AuthDto> {
    const body = await this.users.prepareSignatureBody(
      SignatureType.SIGNUP,
      dto.address,
    );
    if (!verifySignature(body, dto.signature, [dto.address])) {
      throw new ControlledError(
        ErrorAuth.InvalidSignature,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.issueTokens(await this.users.createWeb3User(dto.address));
  }

  async web3Signin(dto: Web3SignInDto): Promise<AuthDto> {
    const user = await this.users.getByAddress(dto.address);
    const body = await this.users.prepareSignatureBody(
      SignatureType.SIGNIN,
      dto.address,
    );
    if (!verifySignature(body, dto.signature, [dto.address])) {
      throw new ControlledError(
        ErrorAuth.InvalidSignature,
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.users.updateNonce(user);
    return this.issueTokens(user);
  }

  hashToken(token: string): string {
    return createHash('sha256')
      .update(token + this.salt)
      .digest('hex');
  }
  compareToken(raw: string, hashed: string): boolean {
    return this.hashToken(raw) === hashed;
  }
}

const authExpiry = {
  access: 600, // seconds
  refresh: 3600,
};

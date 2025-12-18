import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The private key used for signing JSON Web Tokens (JWT).
   * Required
   */
  get jwtPrivateKey(): string {
    return this.configService.getOrThrow('JWT_PRIVATE_KEY');
  }

  /**
   * The public key used for verifying JSON Web Tokens (JWT).
   * Required
   */
  get jwtPublicKey(): string {
    return this.configService.getOrThrow('JWT_PUBLIC_KEY');
  }

  /**
   * The expiration time (in seconds) for access tokens.
   * Default: 600 (10 minutes)
   */
  get accessTokenExpiresIn(): number {
    return Number(this.configService.get('JWT_ACCESS_TOKEN_EXPIRES_IN')) || 600;
  }

  /**
   * The expiration time (in ms) for refresh tokens.
   * Default: 3600000 (60 minutes)
   */
  get refreshTokenExpiresIn(): number {
    const configValueSeconds =
      Number(this.configService.get('JWT_REFRESH_TOKEN_EXPIRES_IN')) || 3600;
    return configValueSeconds * 1000;
  }

  get adminApiKey(): string | undefined {
    return this.configService.get('ADMIN_API_KEY');
  }
}

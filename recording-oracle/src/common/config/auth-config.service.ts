import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthConfigService {
  constructor(private readonly config: ConfigService) {}

  get jwtPrivateKey(): string {
    return Buffer.from(
      this.config.get<string>('JWT_PRIVATE_KEY', ''),
      'base64',
    ).toString();
  }

  get jwtPublicKey(): string {
    return Buffer.from(
      this.config.get<string>('JWT_PUBLIC_KEY', ''),
      'base64',
    ).toString();
  }

  /** Seconds (default 10 min). */
  get accessTokenExpiresIn(): number {
    return Number(this.config.get('JWT_ACCESS_TOKEN_EXPIRES_IN', 600));
  }

  /** Seconds (default 1 h). */
  get refreshTokenExpiresIn(): number {
    return Number(this.config.get('JWT_REFRESH_TOKEN_EXPIRES_IN', 3600));
  }

  /** Random salt for hashing refresh‑tokens. */
  get tokenSalt(): string {
    return this.config.get<string>('JWT_TOKEN_SALT', 'CHANGE_ME');
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthConfigService } from '../../../common/config/auth-config.service';
import { TokenType } from '../../../common/enums/token';
import { UserStatus } from '../../../common/enums/user';
import { ControlledError } from '../../../common/errors/controlled';
import { UserEntity } from '../../../database/entities';
import { UserRepository } from '../../user/user.repository';
import { TokenRepository } from '../token.repository';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, 'jwt-http') {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenRepository,
    cfg: AuthConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.jwtPublicKey,
      passReqToCallback: false,
    });
  }

  async validate(payload: { userId: string }): Promise<UserEntity> {
    const user = await this.users.findById(payload.userId);
    if (!user)
      throw new ControlledError('User not found', HttpStatus.UNAUTHORIZED);
    if (user.status !== UserStatus.ACTIVE) {
      throw new ControlledError('User not active', HttpStatus.UNAUTHORIZED);
    }

    const refresh = await this.tokens.findOneByUserIdAndType(
      user.id,
      TokenType.REFRESH,
    );
    if (!refresh || refresh.expiresAt < new Date()) {
      throw new ControlledError('Session expired', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}

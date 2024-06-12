import { HttpStatus, Injectable, Req } from '@nestjs/common';
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
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly authConfigService: AuthConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfigService.jwtPublicKey,
      passReqToCallback: true,
    });
  }

  public async validate(
    @Req() request: any,
    payload: { userId: string },
  ): Promise<UserEntity> {
    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      throw new ControlledError('User not found', HttpStatus.UNAUTHORIZED);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ControlledError('User not active', HttpStatus.UNAUTHORIZED);
    }

    const token = await this.tokenRepository.findOneByUserIdAndType(
      user.id,
      TokenType.REFRESH,
    );

    if (!token) {
      throw new ControlledError(
        'User is not authorized',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}

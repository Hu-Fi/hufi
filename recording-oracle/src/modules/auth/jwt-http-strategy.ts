import { Injectable, Req } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JWT_STRATEGY_NAME } from '@/common/constants';
import { AuthConfigService } from '@/config';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(
  Strategy,
  JWT_STRATEGY_NAME,
) {
  constructor(authConfigService: AuthConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfigService.jwtPublicKey,
      passReqToCallback: true,
    });
  }

  async validate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() _request: any,
    payload: { user_id: string },
  ): Promise<{ id: string }> {
    return { id: payload.user_id };
  }
}

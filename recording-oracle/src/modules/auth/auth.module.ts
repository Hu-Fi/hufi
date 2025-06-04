import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthConfigService } from '@/config';
import { UsersModule } from '@/modules/users';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtHttpStrategy } from './jwt-http-strategy';
import { RefreshTokenRepository } from './refresh-token.repository';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AuthConfigService],
      useFactory: (authConfigService: AuthConfigService) => ({
        privateKey: authConfigService.jwtPrivateKey,
        signOptions: {
          algorithm: 'ES256',
          expiresIn: authConfigService.accessTokenExpiresIn,
        },
      }),
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtHttpStrategy, RefreshTokenRepository],
  controllers: [AuthController],
})
export class AuthModule {}

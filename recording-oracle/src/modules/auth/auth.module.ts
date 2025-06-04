import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenRepository } from './token.repository';
import { AuthConfigService } from '../../config';
import { UsersModule } from '../users';

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
  providers: [AuthService, TokenRepository],
  controllers: [AuthController],
  exports: [TokenRepository],
})
export class AuthModule {}

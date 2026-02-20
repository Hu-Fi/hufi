import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthConfigService } from '@/config';
import { UsersModule } from '@/modules/users';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtHttpStrategy } from './jwt-http-strategy';
import { RefreshTokenEntity } from './refresh-token.entity';
import { RefreshTokensRepository } from './refresh-tokens.repository';

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
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    UsersModule,
  ],
  providers: [AuthService, JwtHttpStrategy, RefreshTokensRepository],
  controllers: [AuthController],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthConfigService } from '../../common/config/auth-config.service';
import { TokenEntity, UserEntity } from '../../database/entities';
import { UserModule } from '../user/user.module';
import { Web3Module } from '../web3/web3.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtHttpStrategy } from './strategy';
import { TokenRepository } from './token.repository';

@Module({
  imports: [
    UserModule,
    Web3Module,
    JwtModule.registerAsync({
      inject: [AuthConfigService],
      useFactory: (cfg: AuthConfigService) => ({
        privateKey: cfg.jwtPrivateKey,
        signOptions: {
          algorithm: 'RS256',
          expiresIn: cfg.accessTokenExpiresIn,
        },
      }),
    }),
    TypeOrmModule.forFeature([TokenEntity, UserEntity]),
  ],
  providers: [JwtHttpStrategy, AuthService, TokenRepository],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthConfigService } from '../../common/config/auth-config.service';
import { TokenEntity, UserEntity } from '../../database/entities';
import { UserModule } from '../user/user.module';
import { UserRepository } from '../user/user.repository';
import { Web3Module } from '../web3/web3.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtHttpStrategy } from './strategy';
import { TokenRepository } from './token.repository';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      inject: [AuthConfigService],
      useFactory: (authConfigService: AuthConfigService) => ({
        privateKey: authConfigService.jwtPrivateKey,
        signOptions: {
          algorithm: 'RS256',
          expiresIn: authConfigService.accessTokenExpiresIn,
        },
      }),
    }),
    TypeOrmModule.forFeature([TokenEntity, UserEntity]),
    Web3Module,
  ],
  providers: [JwtHttpStrategy, AuthService, TokenRepository, UserRepository],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

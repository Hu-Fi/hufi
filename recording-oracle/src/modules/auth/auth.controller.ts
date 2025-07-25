import { Body, Controller, HttpCode, Post, UseFilters } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

import { Public } from '@/common/decorators';
import { UsersService } from '@/modules/users';

import {
  AuthDto,
  ObtainNonceDto,
  ObtainNonceSuccessDto,
  RefreshDto,
  SuccessAuthDto,
} from './auth.dto';
import { AuthControllerErrorsFilter } from './auth.error-filter';
import { AuthService } from './auth.service';
import { RefreshTokensRepository } from './refresh-tokens.repository';

@ApiTags('Auth')
@Public()
@Controller('/auth')
@UseFilters(AuthControllerErrorsFilter)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  @ApiOperation({
    summary: 'Web3 signature body',
    description: 'Endpoint for retrieving the nonce used for signing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Nonce retrieved successfully',
    type: ObtainNonceSuccessDto,
  })
  @ApiBody({ type: ObtainNonceDto })
  @Post('/nonce')
  @HttpCode(200)
  async getNonce(@Body() data: ObtainNonceDto): Promise<ObtainNonceSuccessDto> {
    const nonce = await this.usersService.getNonce(data.address);
    return { nonce };
  }

  @ApiOperation({
    summary: 'Web3 auth',
    description: 'Endpoint for Web3 authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'User authed successfully',
    type: SuccessAuthDto,
  })
  @ApiBody({ type: AuthDto })
  @Post('/')
  @HttpCode(200)
  async auth(@Body() data: AuthDto): Promise<SuccessAuthDto | undefined> {
    const authTokens = await this.authService.auth(
      data.signature,
      data.address,
    );
    return authTokens;
  }

  @ApiOperation({
    summary: 'Refresh token',
    description: 'Endpoint to refresh the authentication token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: SuccessAuthDto,
  })
  @ApiBody({ type: RefreshDto })
  @Post('/refresh')
  @HttpCode(200)
  async refreshToken(@Body() data: RefreshDto): Promise<SuccessAuthDto> {
    const authTokens = await this.authService.refresh(data.refreshToken);
    return authTokens;
  }

  @ApiOperation({
    summary: 'User logout',
    description: 'Endpoint to log out the user',
  })
  @ApiResponse({
    status: 204,
    description: 'User logged out successfully',
  })
  @ApiBody({ type: RefreshDto })
  @Post('/logout')
  @HttpCode(204)
  async logout(@Body() data: RefreshDto): Promise<void> {
    await this.refreshTokensRepository.deleteById(data.refreshToken);
  }
}

import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseFilters,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { Public } from '@/common/decorators';
import type { RequestWithUser } from '@/common/types';
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
import { RefreshTokenRepository } from './refresh-token.repository';

@ApiTags('Auth')
@Controller('/auth')
@UseFilters(AuthControllerErrorsFilter)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  @Public()
  @Post('/nonce')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Web3 signature body',
    description: 'Endpoint for retrieving the nonce used for signing.',
  })
  @ApiBody({ type: ObtainNonceDto })
  @ApiResponse({
    status: 200,
    description: 'Nonce retrieved successfully',
    type: ObtainNonceSuccessDto,
  })
  public async getNonce(
    @Body() data: ObtainNonceDto,
  ): Promise<ObtainNonceSuccessDto> {
    const nonce = await this.usersService.getNonce(data.address);
    return { nonce };
  }

  @ApiOperation({
    summary: 'Web3 auth',
    description: 'Endpoint for Web3 authentication',
  })
  @ApiBody({ type: AuthDto })
  @ApiResponse({
    status: 200,
    description: 'User authed successfully',
    type: SuccessAuthDto,
  })
  @Public()
  @Post('/')
  @HttpCode(200)
  async auth(@Body() data: AuthDto): Promise<SuccessAuthDto | undefined> {
    const authTokens = await this.authService.auth(
      data.signature,
      data.address,
    );
    return authTokens;
  }

  @ApiBody({ type: RefreshDto })
  @ApiOperation({
    summary: 'Refresh token',
    description: 'Endpoint to refresh the authentication token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: SuccessAuthDto,
  })
  @Public()
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
    status: 200,
    description: 'User logged out successfully',
  })
  @ApiBearerAuth()
  @Post('/logout')
  @HttpCode(204)
  async logout(@Req() request: RequestWithUser): Promise<void> {
    await this.refreshTokenRepository.deleteByUserId(request.user.id);
  }
}

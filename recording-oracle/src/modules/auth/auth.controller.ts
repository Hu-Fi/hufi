import { Body, Controller, HttpCode, Post, UseFilters } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

import { AuthDto, NonceDto, NonceSuccessDto, SuccessAuthDto } from './auth.dto';
import { AuthControllerErrorsFilter } from './auth.error-filter';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators';
import { UsersService } from '../users';

@ApiTags('Auth')
@Controller('/auth')
@UseFilters(AuthControllerErrorsFilter)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('/prepare-signature')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Web3 signature body',
    description: 'Endpoint for retrieving the nonce used for signing.',
  })
  @ApiBody({ type: NonceDto })
  @ApiResponse({
    status: 200,
    description: 'Nonce retrieved successfully',
    type: NonceSuccessDto,
  })
  public async getNonce(@Body() data: NonceDto): Promise<NonceSuccessDto> {
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
  @Post('/auth')
  @HttpCode(200)
  async auth(@Body() data: AuthDto): Promise<SuccessAuthDto | undefined> {
    const authTokens = await this.authService.auth(
      data.signature,
      data.address,
    );
    return authTokens;
  }
}

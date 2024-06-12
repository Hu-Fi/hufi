import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators';

import {
  AuthDto,
  RefreshTokenDto,
  Web3SignInDto,
  Web3SignUpDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { TokenRepository } from './token.repository';

@ApiTags('Auth')
@Controller('/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly tokenRepository: TokenRepository,
  ) {}

  @Public()
  @Post('/web3/signup')
  @ApiOperation({
    summary: 'Web3 User Signup',
    description: 'Endpoint for Web3 user registration.',
  })
  @ApiBody({ type: Web3SignUpDto })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
    type: AuthDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  public async web3SignUp(@Body() data: Web3SignUpDto): Promise<AuthDto> {
    return this.authService.web3Signup(data);
  }

  @Public()
  @Post('/web3/signin')
  @ApiOperation({
    summary: 'Web3 User Signin',
    description: 'Endpoint for Web3 user authentication.',
  })
  @ApiBody({ type: Web3SignInDto })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully',
    type: AuthDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  public async web3SignIn(@Body() data: Web3SignInDto): Promise<AuthDto> {
    return this.authService.web3Signin(data);
  }

  @Public()
  @Post('/refresh-token')
  @ApiBody({ type: RefreshTokenDto })
  @ApiOperation({
    summary: 'Refresh Token',
    description: 'Endpoint to refresh the authentication token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthDto,
  })
  async refreshToken(@Body() data: RefreshTokenDto): Promise<AuthDto> {
    return this.authService.refreshToken(data);
  }
}

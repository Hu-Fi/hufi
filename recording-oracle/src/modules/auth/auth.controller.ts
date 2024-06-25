import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators';
import { SignatureBodyDto } from '../user/user.dto';
import { UserService } from '../user/user.service';

import {
  AuthDto,
  PrepareSignatureDto,
  RefreshTokenDto,
  Web3SignInDto,
  Web3SignUpDto,
} from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('/web3/signup')
  @HttpCode(200)
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
  @HttpCode(200)
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
  @HttpCode(200)
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

  @Public()
  @Post('/prepare-signature')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Web3 signature body',
    description:
      'Endpoint for generating typed structured data objects compliant with EIP-712. The generated object should be convertible to a string format to ensure compatibility with signature mechanisms.',
  })
  @ApiBody({ type: PrepareSignatureDto })
  @ApiResponse({
    status: 200,
    description: 'Typed structured data object generated successfully',
    type: SignatureBodyDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  public async prepareSignature(
    @Body() data: PrepareSignatureDto,
  ): Promise<SignatureBodyDto> {
    return await this.userService.prepareSignatureBody(data.type, data.address);
  }
}

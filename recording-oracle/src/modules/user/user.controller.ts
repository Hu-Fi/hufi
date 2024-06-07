import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';

import { ApiKeyGuard } from '../../common/guards/api-key.guard';

import { SignUpUserDto } from './user.dto';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(ApiKeyGuard)
  @Post('signup')
  @ApiOperation({
    summary: 'Sign up a user',
    description:
      'Registers user and associates with a campaign.\n\n*Security Warning: Please provide the **Read-Only** API key and secret for the exchange.*',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
  })
  @ApiBody({
    type: SignUpUserDto,
    description: 'The required information to sign up a new user.',
  })
  @ApiResponse({
    status: 201,
    description: 'User signed up successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async signUp(@Body() signUpUserDto: SignUpUserDto) {
    const { userId, walletAddress, exchange, apiKey, secret, campaignAddress } =
      signUpUserDto;
    const user = await this.userService.signUp(
      userId,
      walletAddress,
      exchange,
      apiKey,
      secret,
      campaignAddress,
    );
    return { message: 'User signed up successfully', userId: user.userId };
  }
}

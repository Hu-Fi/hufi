import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { SignUpUserDto } from './user.dto';

@ApiTags('users') // Tags this controller for swagger documentation under "users"
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Sign up a user', description: 'Registers user and associates them with a campaign.' })
  @ApiBody({ type: SignUpUserDto, description: 'The required information to sign up a new user.' })
  @ApiResponse({ status: 201, description: 'User signed up successfully', type: Object }) // Customize the response object as needed
  @ApiResponse({ status: 400, description: 'Bad request' })
  async signUp(@Body() signUpUserDto: SignUpUserDto) {
    const { userId,exchange, apiKey, secret, campaignAddress } = signUpUserDto;
    const user = await this.userService.signUp(userId,exchange, apiKey, secret, campaignAddress);
    return { message: 'User signed up successfully', userId: user.userId };
  }
}

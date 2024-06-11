import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RequestWithUser } from '../../common/types/request';
import { ExchangeAPIKeyEntity } from '../../database/entities';

import { ExchangeAPIKeyCreateRequestDto } from './user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post('exchange-api-key')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register exchange API key',
    description:
      '*Security Warning: Please provide the **Read-Only** API key and secret for the exchange.*',
  })
  @ApiBody({
    type: ExchangeAPIKeyCreateRequestDto,
    description: 'Exchange name, API key and secret',
  })
  @ApiResponse({
    status: 201,
    description: 'Created a new exchange API key record for the user',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  public async createExchangeAPIKey(
    @Req() request: RequestWithUser,
    @Body() data: ExchangeAPIKeyCreateRequestDto,
  ): Promise<ExchangeAPIKeyEntity> {
    return await this.userService.createExchangeAPIKey(request.user, data);
  }
}

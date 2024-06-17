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

import {
  CampaignRegisterRequestDto,
  CampaignRegisterResponseDto,
  ExchangeAPIKeyCreateRequestDto,
} from './user.dto';
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

  @UseGuards(JwtAuthGuard)
  @Post('campaign')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register user to the campaign',
    description:
      'Registers user to the campaign. Exchange API key is required to be registered to the CEX campaign.',
  })
  @ApiBody({
    type: CampaignRegisterRequestDto,
    description: 'Campaign details, and Exchange API key for CEX campaigns.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registered user to the campaign successfully.',
    type: CampaignRegisterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  public async registerForCampaign(
    @Req() request: RequestWithUser,
    @Body() data: CampaignRegisterRequestDto,
  ): Promise<CampaignRegisterResponseDto> {
    await this.userService.registerToCampaign(request.user, data);
    return { success: true };
  }
}

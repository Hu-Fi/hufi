import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { Public } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RequestWithUser } from '../../common/types/request';
import { CampaignEntity, ExchangeAPIKeyEntity } from '../../database/entities';

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

  @Public()
  @HttpCode(200)
  @Get('/:address/exists')
  @ApiOperation({
    summary: 'Check if user exists',
    description: 'Check if user exists by address',
  })
  @ApiResponse({
    status: 200,
    description: 'True if user exists, false otherwise',
    type: Boolean,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  public async checkUserExists(
    @Param('address') address: string,
  ): Promise<boolean> {
    return await this.userService.checkUserExists(address);
  }

  @Get(':address/exchange-api-key/:exchangeName/exists')
  @ApiOperation({
    summary: 'Check if user has exchange API key',
  })
  @ApiResponse({
    status: 200,
    description: 'True if user has exchange API key, false otherwise',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  public async checkExchangeAPIKeyExists(
    @Param('address') address: string,
    @Param('exchangeName') exchangeName: string,
  ): Promise<boolean> {
    return await this.userService.checkExchangeAPIKeyExists(
      address,
      exchangeName,
    );
  }

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

  @UseGuards(JwtAuthGuard)
  @Get('campaign/:address')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check if user is registered to the campaign',
    description: 'Check if user is registered to the campaign',
  })
  @ApiResponse({
    status: 200,
    description: 'User is registered to the campaign',
    type: Boolean,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  public async checkCampaignRegistration(
    @Req() request: RequestWithUser,
    @Param('address') address: string,
  ): Promise<boolean> {
    return await this.userService.checkCampaignRegistration(
      request.user,
      address,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('joined-campaigns/:chainId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all campaigns for a user',
    description: 'Returns all campaigns that the user has joined',
  })
  @ApiResponse({
    status: 200,
    description: 'List of campaigns the user has joined',
    type: [CampaignEntity],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  public async getUserJoinedCampaigns(
    @Req() request: RequestWithUser,
    @Param('chainId') chainId: number,
  ): Promise<CampaignEntity[]> {
    return await this.userService.getUserJoinedCampaigns(request.user, chainId);
  }
}

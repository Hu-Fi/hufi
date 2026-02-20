import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { RequestWithUser } from '@/common/types';
import Environment from '@/common/utils/environment';
import { ParticipationsRepository } from '@/modules/campaigns/participations';

import {
  EnrollExchangeApiKeysDto,
  EnrollExchangeApiKeysResponseDto,
  EnrolledApiKeyDto,
  ExchangeNameParamDto,
  RevalidateApiKeyResponseDto,
} from './exchange-api-keys.dto';
import { ExchangeApiKeysControllerErrorsFilter } from './exchange-api-keys.error-filter';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeysService } from './exchange-api-keys.service';

@ApiTags('Exchange API Keys')
@ApiBearerAuth()
@UseFilters(ExchangeApiKeysControllerErrorsFilter)
@Controller('exchange-api-keys')
export class ExchangeApiKeysController {
  constructor(
    private readonly exchangeApiKeysService: ExchangeApiKeysService,
    private readonly exchangeApiKeysRepository: ExchangeApiKeysRepository,
    private readonly participationsRepository: ParticipationsRepository,
  ) {}

  @ApiOperation({
    summary: 'List enrolled exchanges with api keys',
    description:
      'Returns a list of enrolled API keys for exchanges w/o secret key',
  })
  @ApiResponse({
    status: 200,
    type: EnrolledApiKeyDto,
    isArray: true,
  })
  @Get('/')
  async retrieveEnrolledApiKeys(
    @Req() request: RequestWithUser,
  ): Promise<EnrolledApiKeyDto[]> {
    const userId = request.user.id;

    const enrolledApiKeys =
      await this.exchangeApiKeysService.retrieveEnrolledApiKeys(userId);

    return enrolledApiKeys;
  }

  @ApiOperation({
    summary: 'List all enrolled exchanges',
    description:
      'Returns a list of exchange names for which the user has enrolled API keys',
  })
  @ApiResponse({
    status: 200,
    type: String,
    isArray: true,
  })
  @Get('/exchanges')
  async listExchanges(@Req() request: RequestWithUser): Promise<string[]> {
    const userId = request.user.id;

    const exchanges =
      await this.exchangeApiKeysRepository.listExchangesByUserId(userId);

    return exchanges;
  }

  @ApiOperation({
    summary: 'Enroll API keys for exchange',
    description:
      'Enrolls API keys for provided exchange. If keys already exist for exchange - updates them',
  })
  @ApiResponse({
    status: 200,
    description: 'Exchange API keys enrolled',
    type: EnrollExchangeApiKeysResponseDto,
  })
  @ApiBody({ type: EnrollExchangeApiKeysDto })
  @HttpCode(200)
  @Post('/')
  async enroll(
    @Req() request: RequestWithUser,
    @Body() data: EnrollExchangeApiKeysDto,
  ): Promise<EnrollExchangeApiKeysResponseDto> {
    const userId = request.user.id;
    const { exchangeName, apiKey, secretKey, extras } = data;

    const key = await this.exchangeApiKeysService.enroll({
      userId,
      exchangeName,
      apiKey,
      secretKey,
      extras,
    });

    return { id: key.id };
  }

  @ApiOperation({
    summary: 'Delete API keys for exchange',
  })
  @ApiResponse({
    status: 204,
    description: 'Exchange API keys deleted',
  })
  @HttpCode(204)
  @Delete('/:exchange_name')
  async delete(
    @Req() request: RequestWithUser,
    @Param() params: ExchangeNameParamDto,
  ): Promise<void> {
    const userId = request.user.id;
    const exchangeName = params.exchangeName;

    await this.participationsRepository.removeUserFromActiveCampaigns(userId, [
      exchangeName,
    ]);

    await this.exchangeApiKeysRepository.deleteByUserAndExchange(
      userId,
      exchangeName,
    );
  }

  @ApiOperation({
    summary: 'Retreive API keys for exchange',
    description:
      'This functionality is purely for dev solely and works only in non-production environments',
  })
  @Get('/:exchange_name')
  async retrieve(
    @Req() request: RequestWithUser,
    @Param() params: ExchangeNameParamDto,
  ): Promise<unknown> {
    if (Environment.isProduction()) {
      throw new ForbiddenException('Not available in production');
    }

    const userId = request.user.id;
    const exchangeName = params.exchangeName;

    return this.exchangeApiKeysService.retrieve(userId, exchangeName);
  }

  @ApiOperation({
    summary: 'Revalidate exchange API key',
    description: 'Revalidates exchange API key and returns validity status',
  })
  @ApiResponse({
    status: 200,
    type: RevalidateApiKeyResponseDto,
  })
  @HttpCode(200)
  @Post('/:exchange_name/revalidate')
  async revalidate(
    @Req() request: RequestWithUser,
    @Param() params: ExchangeNameParamDto,
  ): Promise<RevalidateApiKeyResponseDto> {
    const userId = request.user.id;
    const exchangeName = params.exchangeName;

    const result = await this.exchangeApiKeysService.revalidate(
      userId,
      exchangeName,
    );

    return {
      isValid: result.success,
      missingPermissions: result.success ? undefined : result.missing,
    };
  }
}

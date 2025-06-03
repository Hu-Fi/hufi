import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  EnrollExchangeApiKeysDto,
  EnrollExchangeApiKeysResponseDto,
} from './exchange-api-key.dto';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeysService } from './exchange-api-keys.service';

const TEST_USER_ID = 'e83d7dc4-4b3d-4cca-8a3b-a96d887298d8';

@ApiTags('Exchange API Keys')
@Controller('exchange-api-keys')
export class ExchangeApiKeysController {
  constructor(
    private readonly exchangeApiKeysService: ExchangeApiKeysService,
    private readonly exchangeApiKeysRepository: ExchangeApiKeysRepository,
  ) {}

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
  @Get('/')
  async list(): Promise<unknown> {
    const exchanges =
      await this.exchangeApiKeysRepository.listExchangesByUserId(TEST_USER_ID);

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
  @Post('/:exchange_name')
  async enroll(
    @Param('exchange_name') exchangeName: string,
    @Body() data: EnrollExchangeApiKeysDto,
  ): Promise<EnrollExchangeApiKeysResponseDto> {
    const key = await this.exchangeApiKeysService.enroll({
      userId: TEST_USER_ID,
      exchangeName,
      apiKey: data.apiKey,
      secretKey: data.secretKey,
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
  async delete(@Param('exchange_name') exchangeName: string): Promise<void> {
    await this.exchangeApiKeysRepository.deleteByExchangeAndUser(
      TEST_USER_ID,
      exchangeName,
    );
  }
}

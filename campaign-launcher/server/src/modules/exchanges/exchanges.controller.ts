import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ExchangeDataDto, ExchangeNameParamDto } from './exchanges.dto';
import { ExchangesService } from './exchanges.service';

@ApiTags('Exchanges')
@Controller('exchanges')
export class ExchangesController {
  constructor(private exchangesService: ExchangesService) {}

  @ApiOperation({
    summary: 'Returns a list of supported exchanges with details about them',
  })
  @ApiResponse({
    status: 200,
    type: ExchangeDataDto,
    isArray: true,
  })
  @Get('/')
  async getExchangeList(): Promise<ExchangeDataDto[]> {
    return this.exchangesService.supportedExchanges as ExchangeDataDto[];
  }

  @ApiOperation({
    summary: 'Returns list of trading pairs supported by exchange',
  })
  @ApiResponse({
    status: 200,
    type: Array<string>,
  })
  @Get('/:exchange_name/trading-pairs')
  async getExchangeTradingPairs(
    @Param() params: ExchangeNameParamDto,
  ): Promise<string[]> {
    const exchangeName = params.exchangeName;
    const exchangeTradingPairs =
      await this.exchangesService.getExchangeTradingPairs(exchangeName);
    return exchangeTradingPairs;
  }
}

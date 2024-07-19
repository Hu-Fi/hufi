import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ExchangeDataDto } from './exchange.dto';
import { ExchangeService } from './exchange.service';

@ApiTags('exchange')
@Controller('exchange')
export class ExchangeController {
  constructor(private exchangeService: ExchangeService) {}

  @Get('/list')
  @ApiOperation({ summary: 'List the supported exchanges' })
  @ApiResponse({
    status: 200,
    description: 'Exchange list',
    type: Array<ExchangeDataDto>,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getExchangeList() {
    return this.exchangeService.getExchanges();
  }

  @Get('/symbols/:exchangeName')
  @ApiOperation({ summary: 'List the supported symbols/tokens' })
  @ApiParam({ name: 'exchangeName', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Symbols list',
    type: Array<string>,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getSymbols(@Param('exchangeName') exchangeName: string) {
    return this.exchangeService.getSymbols(exchangeName);
  }
}

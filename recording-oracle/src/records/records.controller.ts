import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { RecordService } from './records.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { RequestDto } from './request.dto';

@ApiTags('records')
@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post('calculate-liquidity-score')
  @ApiOperation({ summary: 'Calculate liquidity score', description: 'Calculates the liquidity score for a given exchange, symbol, and user based on trades and open orders.' })
  @ApiBody({
    description: 'Payload to calculate liquidity score',
    type: RequestDto, 
  })
  @ApiResponse({ status: 200, description: 'The calculated liquidity score', type: Number })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async calculateLiquidityScore(@Body() requestDto: RequestDto): Promise<number> {
    try {
      const { apiKey, secret, exchangeId, symbol, since } = requestDto;
      return await this.recordService.calculateLiquidityScore(apiKey, secret, exchangeId, symbol, since);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}

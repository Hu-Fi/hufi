import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '@/common/decorators';

import { TdxAttestationService } from './tdx-attestation.service';
import * as TdxDto from './tdx-quote.dto';

@ApiTags('TDX Attestation')
@Public()
@Controller('attestation')
export class TdxAttestationController {
  constructor(private readonly tdxAttestationService: TdxAttestationService) {}

  @ApiOperation({ summary: 'Get TDX Quote' })
  @ApiResponse({ status: 200, type: TdxDto.TdxQuoteResponseDto })
  @ApiResponse({ status: 503, description: 'TDX not available' })
  @Get('/quote')
  getQuote(): Promise<TdxDto.TdxQuoteResponseDto> {
    return this.tdxAttestationService.generateQuote();
  }

  @ApiOperation({ summary: 'Get TDX Quote with custom report data' })
  @ApiResponse({ status: 200, type: TdxDto.TdxQuoteResponseDto })
  @Post('/quote')
  getQuoteWithData(
    @Body() request: TdxDto.TdxQuoteRequestDto,
  ): Promise<TdxDto.TdxQuoteResponseDto> {
    return this.tdxAttestationService.generateQuote(request.reportData);
  }

  @ApiOperation({ summary: 'Check TDX availability' })
  @Get('/status')
  getStatus(): { available: boolean; message: string } {
    return this.tdxAttestationService.checkTdxAvailability();
  }
}

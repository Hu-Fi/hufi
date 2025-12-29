import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '@/common/decorators';

import { AttestationService } from './attestation.service';
import {
  QuoteRequestDto,
  QuoteResponseDto,
  StatusResponseDto,
} from './dto/quote.dto';

@ApiTags('Attestation')
@Public()
@Controller('attestation')
export class AttestationController {
  constructor(private readonly attestationService: AttestationService) {}

  @ApiOperation({ summary: 'Get TDX attestation status' })
  @ApiResponse({
    status: 200,
    description: 'TDX status',
    type: StatusResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'TDX attestation proxy unavailable',
  })
  @Get('/status')
  async getStatus(): Promise<StatusResponseDto> {
    return this.attestationService.getStatus();
  }

  @ApiOperation({ summary: 'Generate TDX quote with optional report data' })
  @ApiResponse({
    status: 200,
    description: 'TDX quote generated',
    type: QuoteResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Failed to generate TDX quote',
  })
  @Post('/quote')
  async getQuote(@Body() dto: QuoteRequestDto): Promise<QuoteResponseDto> {
    return this.attestationService.getQuote(dto.reportData);
  }
}

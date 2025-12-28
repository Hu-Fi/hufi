import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import * as TdxDto from './dto/tdx-verification.dto';
import { TdxVerificationService } from './tdx-verification.service';

@ApiTags('TDX Verification')
@Controller('tdx-verification')
export class TdxVerificationController {
  constructor(
    private readonly tdxVerificationService: TdxVerificationService,
  ) {}

  @ApiOperation({ summary: 'Verify TDX Quote' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  @Post('/verify-quote')
  verifyQuote(@Body() dto: TdxDto.VerifyQuoteDto): TdxDto.VerificationResult {
    return this.tdxVerificationService.verifyQuote(dto.quote);
  }

  @ApiOperation({ summary: 'Verify Recording Oracle' })
  @ApiResponse({
    status: 200,
    description: 'Verification result with oracle URL',
  })
  @Post('/verify-oracle')
  async verifyOracle(
    @Body() dto: TdxDto.VerifyOracleDto,
  ): Promise<TdxDto.VerificationResult & { oracleUrl: string }> {
    return this.tdxVerificationService.verifyRecordingOracle(
      dto.oracleUrl,
      dto.challengeData,
    );
  }

  @ApiOperation({
    summary: 'Get Expected Measurements (baked in at build time)',
  })
  @ApiResponse({ status: 200, description: 'Expected measurements' })
  @Get('/expected-measurements')
  getExpectedMeasurements(): TdxDto.TdxMeasurements {
    return this.tdxVerificationService.getExpectedMeasurements();
  }

  @ApiOperation({ summary: 'Get Build Info' })
  @ApiResponse({
    status: 200,
    description: 'Build info including git sha and image digest',
  })
  @Get('/build-info')
  getBuildInfo() {
    return this.tdxVerificationService.getBuildInfo();
  }

  @ApiOperation({
    summary: 'Verify TDX Quote with Intel DCAP Certificate Chain Validation',
  })
  @ApiResponse({
    status: 200,
    description: 'Full verification result including DCAP validation',
  })
  @Post('/verify-quote-dcap')
  async verifyQuoteDcap(
    @Body() dto: TdxDto.VerifyQuoteDto,
  ): Promise<TdxDto.DcapVerificationResult> {
    return this.tdxVerificationService.verifyQuoteWithDcap(dto.quote);
  }

  @ApiOperation({
    summary: 'Verify Recording Oracle with DCAP Validation',
  })
  @ApiResponse({
    status: 200,
    description: 'Full verification result including DCAP validation and oracle URL',
  })
  @Post('/verify-oracle-dcap')
  async verifyOracleDcap(
    @Body() dto: TdxDto.VerifyOracleDto,
  ): Promise<TdxDto.DcapVerificationResult & { oracleUrl: string }> {
    return this.tdxVerificationService.verifyRecordingOracleWithDcap(
      dto.oracleUrl,
      dto.challengeData,
    );
  }
}

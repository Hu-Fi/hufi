import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsHexadecimal } from 'class-validator';

export class VerifyQuoteDto {
  @ApiProperty({ description: 'Base64-encoded TDX quote' })
  @IsString()
  quote: string;
}

export class VerifyOracleDto {
  @ApiProperty({ description: 'URL of the recording oracle to verify' })
  @IsUrl()
  oracleUrl: string;

  @ApiPropertyOptional({ description: 'Optional challenge data (hex string)' })
  @IsOptional()
  @IsHexadecimal()
  challengeData?: string;
}

export interface TdxMeasurements {
  mrtd: string;
  rtmr0: string;
  rtmr1: string;
  rtmr2: string;
  rtmr3: string;
}

export interface VerificationResult {
  valid: boolean;
  measurements: TdxMeasurements;
  reportData: string;
  errors: string[];
  warnings: string[];
}

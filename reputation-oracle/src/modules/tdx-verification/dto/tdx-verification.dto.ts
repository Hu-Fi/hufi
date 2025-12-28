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

/**
 * Intel DCAP verification result
 */
export interface DcapResult {
  /** Whether the quote signature is valid */
  signatureValid: boolean;
  /** Whether the certificate chain validates to Intel Root CA */
  certificateChainValid: boolean;
  /** TCB status from Intel (UpToDate, SWHardeningNeeded, etc.) */
  tcbStatus: string;
  /** Security advisories that apply to this TCB level */
  advisoryIDs: string[];
  /** DCAP-specific errors */
  errors: string[];
  /** DCAP-specific warnings */
  warnings: string[];
}

/**
 * Combined verification result with DCAP
 */
export interface DcapVerificationResult extends VerificationResult {
  /** Intel DCAP certificate chain validation result */
  dcapResult?: DcapResult;
}

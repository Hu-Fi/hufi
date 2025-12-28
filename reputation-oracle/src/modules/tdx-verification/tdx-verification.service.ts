import * as crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

import type {
  DcapVerificationResult,
  TdxMeasurements,
  VerificationResult,
} from './dto/tdx-verification.dto';
import { IntelDcapService } from './intel-dcap.service';
import {
  TDX_MEASUREMENTS,
  TDX_BUILD_INFO,
  hasMeasurements,
} from './tdx-measurements';

// TDX Quote structure offsets (TDX Quote v4)
const TD_REPORT_OFFSET = 48;
const TD_REPORT_SIZE = 584;
const MRTD_OFFSET = 128;
const MRTD_SIZE = 48;
const RTMR_OFFSET = 368;
const RTMR_SIZE = 48;
const REPORT_DATA_OFFSET = 520;
const REPORT_DATA_SIZE = 64;

export type { TdxMeasurements, VerificationResult };

interface ParsedQuote {
  measurements: TdxMeasurements;
  reportData: Buffer;
}

@Injectable()
export class TdxVerificationService {
  private readonly logger = new Logger(TdxVerificationService.name);

  constructor(private readonly intelDcapService: IntelDcapService) {
    if (hasMeasurements()) {
      this.logger.log(`TDX measurements loaded from build`);
      this.logger.log(`  MRTD: ${TDX_MEASUREMENTS.mrtd.substring(0, 32)}...`);
      if (TDX_BUILD_INFO.gitSha) {
        this.logger.log(`  Git SHA: ${TDX_BUILD_INFO.gitSha}`);
      }
    } else {
      this.logger.warn('No TDX measurements configured at build time');
    }
  }

  parseQuote(quoteBase64: string): ParsedQuote {
    const quote = Buffer.from(quoteBase64, 'base64');

    if (quote.length < TD_REPORT_OFFSET + TD_REPORT_SIZE) {
      throw new Error(`Invalid TDX quote: too short (${quote.length} bytes)`);
    }

    const mrtdStart = TD_REPORT_OFFSET + MRTD_OFFSET;
    const rtmrStart = TD_REPORT_OFFSET + RTMR_OFFSET;
    const reportDataStart = TD_REPORT_OFFSET + REPORT_DATA_OFFSET;

    return {
      measurements: {
        mrtd: quote.subarray(mrtdStart, mrtdStart + MRTD_SIZE).toString('hex'),
        rtmr0: quote.subarray(rtmrStart, rtmrStart + RTMR_SIZE).toString('hex'),
        rtmr1: quote
          .subarray(rtmrStart + RTMR_SIZE, rtmrStart + 2 * RTMR_SIZE)
          .toString('hex'),
        rtmr2: quote
          .subarray(rtmrStart + 2 * RTMR_SIZE, rtmrStart + 3 * RTMR_SIZE)
          .toString('hex'),
        rtmr3: quote
          .subarray(rtmrStart + 3 * RTMR_SIZE, rtmrStart + 4 * RTMR_SIZE)
          .toString('hex'),
      },
      reportData: quote.subarray(
        reportDataStart,
        reportDataStart + REPORT_DATA_SIZE,
      ),
    };
  }

  verifyQuote(quoteBase64: string): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: ParsedQuote;
    try {
      parsed = this.parseQuote(quoteBase64);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        measurements: { mrtd: '', rtmr0: '', rtmr1: '', rtmr2: '', rtmr3: '' },
        reportData: '',
        errors: [`Failed to parse quote: ${message}`],
        warnings: [],
      };
    }

    if (!hasMeasurements()) {
      warnings.push('No expected measurements configured at build time');
    } else {
      const checks: [string, keyof TdxMeasurements][] = [
        ['MRTD', 'mrtd'],
        ['RTMR[0]', 'rtmr0'],
        ['RTMR[1]', 'rtmr1'],
        ['RTMR[2]', 'rtmr2'],
        ['RTMR[3]', 'rtmr3'],
      ];
      for (const [name, key] of checks) {
        if (
          TDX_MEASUREMENTS[key] &&
          parsed.measurements[key] !== TDX_MEASUREMENTS[key]
        ) {
          errors.push(
            `${name} mismatch: expected ${TDX_MEASUREMENTS[key]}, got ${parsed.measurements[key]}`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      measurements: parsed.measurements,
      reportData: parsed.reportData.toString('base64'),
      errors,
      warnings,
    };
  }

  async verifyRecordingOracle(
    oracleUrl: string,
    challengeData?: string,
  ): Promise<VerificationResult & { oracleUrl: string }> {
    try {
      const challenge = challengeData || crypto.randomBytes(32).toString('hex');

      const response = await fetch(`${oracleUrl}/attestation/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData: challenge }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { quote?: string };
      if (!data.quote) throw new Error('No quote in response');

      const result = this.verifyQuote(data.quote);

      const reportDataHex = Buffer.from(result.reportData, 'base64').toString(
        'hex',
      );
      if (!reportDataHex.startsWith(challenge)) {
        result.errors.push('Challenge mismatch in report_data');
        result.valid = false;
      }

      return { ...result, oracleUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        measurements: { mrtd: '', rtmr0: '', rtmr1: '', rtmr2: '', rtmr3: '' },
        reportData: '',
        errors: [`Failed to verify oracle: ${message}`],
        warnings: [],
        oracleUrl,
      };
    }
  }

  getExpectedMeasurements(): TdxMeasurements {
    return TDX_MEASUREMENTS;
  }

  getBuildInfo(): typeof TDX_BUILD_INFO {
    return TDX_BUILD_INFO;
  }

  /**
   * Verify TDX quote with Intel DCAP certificate chain validation
   */
  async verifyQuoteWithDcap(quoteBase64: string): Promise<DcapVerificationResult> {
    // First, run measurement verification
    const measurementResult = this.verifyQuote(quoteBase64);

    // Then, run Intel DCAP verification
    const dcapResult = await this.intelDcapService.verifyQuoteDcap(quoteBase64);

    // Combine results
    const combinedValid =
      measurementResult.valid &&
      dcapResult.signatureValid &&
      dcapResult.certificateChainValid;

    return {
      ...measurementResult,
      valid: combinedValid,
      dcapResult: {
        signatureValid: dcapResult.signatureValid,
        certificateChainValid: dcapResult.certificateChainValid,
        tcbStatus: dcapResult.tcbStatus,
        advisoryIDs: dcapResult.advisoryIDs,
        errors: dcapResult.errors,
        warnings: dcapResult.warnings,
      },
    };
  }

  /**
   * Verify recording oracle with DCAP validation
   */
  async verifyRecordingOracleWithDcap(
    oracleUrl: string,
    challengeData?: string,
  ): Promise<DcapVerificationResult & { oracleUrl: string }> {
    try {
      const challenge = challengeData || crypto.randomBytes(32).toString('hex');

      const response = await fetch(`${oracleUrl}/attestation/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData: challenge }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { quote?: string };
      if (!data.quote) throw new Error('No quote in response');

      const result = await this.verifyQuoteWithDcap(data.quote);

      const reportDataHex = Buffer.from(result.reportData, 'base64').toString(
        'hex',
      );
      if (!reportDataHex.startsWith(challenge)) {
        result.errors.push('Challenge mismatch in report_data');
        result.valid = false;
      }

      return { ...result, oracleUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        measurements: { mrtd: '', rtmr0: '', rtmr1: '', rtmr2: '', rtmr3: '' },
        reportData: '',
        errors: [`Failed to verify oracle: ${message}`],
        warnings: [],
        oracleUrl,
      };
    }
  }
}

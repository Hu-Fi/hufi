import { exec } from 'child_process';
import * as fs from 'fs';
import { promisify } from 'util';

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

import { TdxQuoteResponseDto } from './tdx-quote.dto';

const execAsync = promisify(exec);

const TDX_QUOTE_GEN =
  process.env.TDX_QUOTE_GEN_PATH || '/usr/local/bin/tdx_quote_gen';
const TDX_DEVICE = process.env.TDX_DEVICE_PATH || '/dev/tdx_guest';
const TDX_ATTESTATION_PROXY_URL = process.env.TDX_ATTESTATION_PROXY_URL || '';

interface TdxQuoteGenResult {
  quote?: string;
  quote_size?: number;
  report?: string;
  report_data?: string;
  error?: string;
}

@Injectable()
export class TdxAttestationService {
  private readonly logger = new Logger(TdxAttestationService.name);

  checkTdxAvailability(): { available: boolean; message: string } {
    if (TDX_ATTESTATION_PROXY_URL) {
      return { available: true, message: 'TDX attestation via proxy' };
    }
    if (!fs.existsSync(TDX_DEVICE)) {
      return { available: false, message: 'TDX device not found' };
    }
    if (!fs.existsSync(TDX_QUOTE_GEN)) {
      return { available: false, message: 'TDX quote generator not installed' };
    }
    return { available: true, message: 'TDX attestation available' };
  }

  async generateQuote(reportDataHex?: string): Promise<TdxQuoteResponseDto> {
    const status = this.checkTdxAvailability();
    if (!status.available) {
      throw new HttpException(status.message, HttpStatus.SERVICE_UNAVAILABLE);
    }

    if (reportDataHex && !/^[0-9a-fA-F]*$/.test(reportDataHex)) {
      throw new HttpException(
        'Invalid report data: must be hex string',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      let result: TdxQuoteGenResult;

      if (TDX_ATTESTATION_PROXY_URL) {
        result = await this.fetchFromProxy(reportDataHex);
      } else {
        result = await this.generateLocally(reportDataHex);
      }

      if (result.error) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        quote: result.quote || '',
        quoteSize: result.quote_size || 0,
        report: result.report || '',
        reportData: result.report_data || '',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to generate TDX quote', error);
      throw new HttpException(
        `Failed to generate TDX quote: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async fetchFromProxy(
    reportDataHex?: string,
  ): Promise<TdxQuoteGenResult> {
    const url = reportDataHex
      ? `${TDX_ATTESTATION_PROXY_URL}/quote?report_data=${reportDataHex}`
      : `${TDX_ATTESTATION_PROXY_URL}/quote`;

    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Proxy error: ${response.status} ${text}`);
    }
    return response.json();
  }

  private async generateLocally(
    reportDataHex?: string,
  ): Promise<TdxQuoteGenResult> {
    const command = reportDataHex
      ? `${TDX_QUOTE_GEN} ${reportDataHex}`
      : TDX_QUOTE_GEN;
    const { stdout } = await execAsync(command, { timeout: 30000 });
    return JSON.parse(stdout);
  }
}

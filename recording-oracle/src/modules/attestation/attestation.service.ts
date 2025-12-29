import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { QuoteResponseDto, StatusResponseDto } from './dto/quote.dto';

@Injectable()
export class AttestationService {
  private readonly logger = new Logger(AttestationService.name);
  private readonly proxyUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.proxyUrl = this.configService.get<string>(
      'TDX_ATTESTATION_PROXY_URL',
      'http://localhost:8081',
    );
    this.logger.log(`TDX Attestation Proxy URL: ${this.proxyUrl}`);
  }

  async getStatus(): Promise<StatusResponseDto> {
    try {
      const response = await fetch(`${this.proxyUrl}/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return (await response.json()) as StatusResponseDto;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get TDX status: ${message}`);
      throw new ServiceUnavailableException(
        `TDX attestation proxy unavailable: ${message}`,
      );
    }
  }

  async getQuote(reportData?: string): Promise<QuoteResponseDto> {
    try {
      let url = `${this.proxyUrl}/quote`;

      // If reportData is provided, we need to pass it to the proxy
      // The proxy accepts report_data as a query parameter or we construct the URL
      if (reportData) {
        // Convert hex to base64 for the proxy if needed
        const reportDataBuffer = Buffer.from(reportData, 'hex');
        // Pad to 64 bytes if needed
        const paddedData = Buffer.alloc(64);
        reportDataBuffer.copy(
          paddedData,
          0,
          0,
          Math.min(64, reportDataBuffer.length),
        );
        url += `?report_data=${paddedData.toString('base64')}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        quote: string;
        quote_size: number;
        report_data: string;
        measurements?: {
          mrtd: string;
          rtmr0: string;
          rtmr1: string;
          rtmr2: string;
          rtmr3: string;
        };
      };

      return {
        quote: data.quote,
        quoteSize: data.quote_size,
        reportData: data.report_data,
        measurements: data.measurements,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get TDX quote: ${message}`);
      throw new ServiceUnavailableException(
        `Failed to generate TDX quote: ${message}`,
      );
    }
  }
}

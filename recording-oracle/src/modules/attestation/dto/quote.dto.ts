import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QuoteRequestDto {
  @ApiPropertyOptional({
    description: 'Report data to embed in the TDX quote (hex string)',
  })
  @IsOptional()
  @IsString()
  reportData?: string;
}

export class QuoteResponseDto {
  @ApiProperty({ description: 'Base64-encoded TDX quote' })
  quote: string;

  @ApiProperty({ description: 'Size of the quote in bytes' })
  quoteSize: number;

  @ApiProperty({ description: 'Report data embedded in the quote (base64)' })
  reportData: string;

  @ApiPropertyOptional({ description: 'TDX measurements extracted from quote' })
  measurements?: {
    mrtd: string;
    rtmr0: string;
    rtmr1: string;
    rtmr2: string;
    rtmr3: string;
  };
}

export class StatusResponseDto {
  @ApiProperty({ description: 'Whether TDX is available' })
  available: boolean;

  @ApiPropertyOptional({ description: 'TDX device path' })
  device?: string;

  @ApiPropertyOptional({ description: 'TSM configfs path' })
  tsmPath?: string;

  @ApiPropertyOptional({ description: 'Whether TSM is available' })
  tsmAvailable?: boolean;
}

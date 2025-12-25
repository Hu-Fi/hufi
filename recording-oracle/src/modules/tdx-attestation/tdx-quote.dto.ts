import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class TdxQuoteRequestDto {
  @ApiPropertyOptional({
    description:
      'Custom report data to bind to the quote (hex string, up to 128 chars = 64 bytes)',
    example: '0123456789abcdef',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(/^[0-9a-fA-F]*$/, {
    message: 'reportData must be a valid hex string',
  })
  reportData?: string;
}

export class TdxQuoteResponseDto {
  @ApiProperty({
    description: 'Base64-encoded TDX quote',
  })
  quote: string;

  @ApiProperty({
    description: 'Size of the quote in bytes',
  })
  quoteSize: number;

  @ApiProperty({
    description: 'Base64-encoded TD report',
  })
  report: string;

  @ApiProperty({
    description: 'Base64-encoded report data that was bound to the quote',
  })
  reportData: string;

  @ApiProperty({
    description: 'Timestamp when the quote was generated',
  })
  timestamp: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class RequestDto {
  @ApiProperty({ example: 'binance', description: 'Exchange name' })
  exchangeId: string;
  @ApiProperty({ example: 'xxx', description: 'API Key for the Exchange' })
  apiKey: string;
  @ApiProperty({ example: 'xxx', description: 'API SECRET for the Exchange' })
  secret: string;

  @ApiProperty({ example: 'BTC/USDT', description: 'Trading pair symbol' })
  symbol: string;

  @ApiProperty({
    example: '16000000000',
    description: 'Address of the campaign to sign up for.',
  })
  since: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class SignUpUserDto {
  @ApiProperty({ example: '1', description: 'UserID' })
  userId: string;
  @ApiProperty({ example: 'binance', description: 'Exchange name' })
  exchange: string;
  @ApiProperty({ example: 'xxx', description: 'API Key for the Exchange' })
  apiKey: string;
  @ApiProperty({ example: 'xxx', description: 'API SECRET for the Exchange' })
  secret: string;
  @ApiProperty({
    example: '0x00',
    description: 'Address of the campaign to sign up for.',
  })
  campaignAddress: string;
}

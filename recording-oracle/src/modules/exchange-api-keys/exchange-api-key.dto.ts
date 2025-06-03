import { ApiProperty } from '@nestjs/swagger';

/**
 * TODO:
 * - add validation using `class-validator`
 * - update swagger names to use snake_case
 */
export class EnrollExchangeApiKeysDto {
  @ApiProperty({ name: 'apiKey' })
  apiKey: string;

  @ApiProperty({ name: 'secretKey' })
  secretKey: string;
}

export class EnrollExchangeApiKeysResponseDto {
  @ApiProperty()
  id: string;
}

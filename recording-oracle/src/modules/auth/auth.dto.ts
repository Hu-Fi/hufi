import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString, IsUUID, Matches } from 'class-validator';

import { EVM_SIGNATURE_REGEX } from '@/common/constants';

export class AuthDto {
  @ApiProperty()
  @IsEthereumAddress()
  address: string;

  @ApiProperty()
  @IsString()
  @Matches(EVM_SIGNATURE_REGEX, {
    message:
      'Signature must be a valid Ethereum Web3 signature in hex format starting with "0x',
  })
  signature: string;
}

export class SuccessAuthDto {
  @ApiProperty({ name: 'access_token' })
  accessToken: string;

  @ApiProperty({ name: 'refresh_token' })
  refreshToken: string;
}

export class ObtainNonceDto {
  @ApiProperty()
  @IsEthereumAddress()
  address: string;
}

export class ObtainNonceSuccessDto {
  @ApiProperty()
  @IsString()
  nonce: string;
}

export class RefreshDto {
  @ApiProperty({ name: 'refresh_token' })
  @IsUUID()
  refreshToken: string;
}

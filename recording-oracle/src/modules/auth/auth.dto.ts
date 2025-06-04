import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString, IsUUID, Matches } from 'class-validator';

export class AuthDto {
  @ApiProperty()
  @IsEthereumAddress()
  address: string;

  @ApiProperty()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{130}$/, {
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

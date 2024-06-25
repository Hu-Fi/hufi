import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsEthereumAddress, IsString, IsUUID } from 'class-validator';

import { SignatureType } from '../../common/enums/web3';

export class AuthDto {
  @ApiProperty({ name: 'refresh_token' })
  @IsString()
  public refreshToken: string;

  @ApiProperty({ name: 'access_token' })
  @IsString()
  public accessToken: string;
}

export class Web3SignUpDto {
  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public address: string;

  @ApiProperty()
  @IsString()
  public signature: string;
}

export class Web3SignInDto {
  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public address: string;

  @ApiProperty()
  @IsString()
  public signature: string;
}

export class RefreshTokenDto {
  @ApiProperty({ name: 'refresh_token' })
  @IsUUID()
  public refreshToken: string;
}

export class PrepareSignatureDto {
  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public address: string;

  @ApiProperty({
    enum: SignatureType,
  })
  @IsEnum(SignatureType)
  public type: SignatureType;
}

// export class ForgotPasswordDto {
//   @ApiProperty()
//   @IsEmail()
//   @Transform(({ value }: { value: string }) => value.toLowerCase())
//   public email: string;
// }

// export class SignInDto {
//   @ApiProperty()
//   @IsEmail()
//   @Transform(({ value }: { value: string }) => value.toLowerCase())
//   public email: string;

//   @ApiProperty()
//   @IsString()
//   public password: string;

//   @ApiProperty({ name: 'h_captcha_token' })
//   @IsString()
//   public hCaptchaToken: string;
// }

// export class ValidatePasswordDto {
//   @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
//     message:
//       'Password is not strong enough. Password must be at least eight characters long and contain 1 upper, 1 lowercase, 1 number and 1 special character.',
//   })
//   @ApiProperty()
//   @IsPassword()
//   public password: string;
// }

// export class ResendEmailVerificationDto {
//   @ApiProperty()
//   @IsEmail()
//   @Transform(({ value }: { value: string }) => value.toLowerCase())
//   public email: string;
// }

// export class RestorePasswordDto extends ValidatePasswordDto {
//   @ApiProperty()
//   @IsString()
//   public token: string;

//   @ApiProperty({ name: 'h_captcha_token' })
//   @IsString()
//   public hCaptchaToken: string;
// }

// export class VerifyEmailDto {
//   @ApiProperty()
//   @IsString()
//   public token: string;
// }

// export class AuthCreateDto {
//   public user: UserEntity;
//   public refreshToken: string;
//   public accessToken: string;
// }

// export class AuthUpdateDto {
//   public refreshToken: string;
//   public accessToken: string;
// }

// export class TokenCreateDto {
//   public tokenType: TokenType;
//   public user: UserEntity;
// }

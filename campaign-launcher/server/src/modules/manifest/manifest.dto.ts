import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class ManifestUploadRequestDto {
  @ApiProperty()
  @IsNumber()
  chainId: number;

  @ApiProperty()
  @IsString()
  requesterAddress: string;

  @ApiProperty()
  @IsString()
  exchangeName: string;

  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty()
  @IsString()
  fundAmount: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  additionalData?: string;
}

export class ManifestUploadRequestDtoV2 {
  @ApiProperty()
  @IsNumber()
  chainId: number;

  @ApiProperty()
  @IsString()
  requesterAddress: string;

  @ApiProperty()
  @IsString()
  exchangeName: string;

  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty()
  @IsString()
  fundAmount: string;
}

export class ManifestUploadResponseDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsString()
  hash: string;
}

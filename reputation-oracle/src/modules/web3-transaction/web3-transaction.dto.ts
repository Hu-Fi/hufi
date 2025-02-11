import {
  IsArray,
  IsEnum,
  IsEthereumAddress,
  IsNumber,
  IsString,
} from 'class-validator';

import { Web3TransactionStatus } from '../../common/enums/web3-transaction';

export class Web3TransactionDto {
  @IsNumber()
  chainId: number;

  @IsString()
  contract: string;

  @IsString()
  @IsEthereumAddress()
  address: string;

  @IsString()
  method: string;

  @IsArray()
  data: Array<any>;

  @IsEnum(Web3TransactionStatus)
  status: Web3TransactionStatus;
}

import type { ChainId } from '@/common/constants';
import { IsChainId } from '@/common/validators';

export class GetOracleFeesQueryDto {
  @IsChainId()
  chainId: ChainId;
}

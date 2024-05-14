import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet, JsonRpcProvider } from 'ethers';
import { ConfigNames, networkMap } from '../../common/config';

@Injectable()
export class Web3Service {
  private signers: { [key: number]: Wallet } = {};

  constructor(private readonly configService: ConfigService) {
    const privateKey = this.configService.get<string>(
      ConfigNames.WEB3_PRIVATE_KEY,
    );
    if (!privateKey) {
      throw new Error('Private key is not configured.');
    }

    Object.keys(networkMap).forEach((networkKey) => {
      const network = networkMap[networkKey];
      const provider = new JsonRpcProvider(network.rpcUrl);
      this.signers[network.chainId] = new Wallet(privateKey, provider);
    });
  }

  getSigner(chainId: number): Wallet {
    const signer = this.signers[chainId];
    if (!signer) {
      throw new Error(`No signer found for chain ID ${chainId}`);
    }
    return signer;
  }
}

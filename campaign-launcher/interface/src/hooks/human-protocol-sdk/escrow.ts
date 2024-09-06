import { useState } from 'react';

import { ChainId, EscrowClient } from '@human-protocol/sdk';
import { ethers } from 'ethers';
import { v4 as uuidV4 } from 'uuid';
import { useAccount } from 'wagmi';

import { useClientToSigner } from './common';
import { useNotification } from '../';
import ERC20ABI from '../../abi/ERC20.json';
import { ManifestUploadResponseDto } from '../../api/client/Api';
import { oracles } from '../../config/escrow';
import { getTokenAddress } from '../../utils/token';

export const useCreateEscrow = () => {
  const { chainId } = useAccount();
  const { signer, network } = useClientToSigner();
  const { setNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const createEscrow = async (
    manifest: ManifestUploadResponseDto,
    fundToken: string,
    fundAmount: bigint
  ) => {
    if (!signer || !network) {
      return;
    }

    setIsLoading(true);

    try {
      const escrowClient = await EscrowClient.build(signer);

      const tokenAddress = getTokenAddress(chainId as ChainId, fundToken);

      if (!tokenAddress?.length) {
        throw new Error('Fund token is not supported.');
      }

      const escrowAddress = await escrowClient.createEscrow(
        tokenAddress,
        [signer.address],
        uuidV4()
      );

      setNotification({
        type: 'success',
        message: 'Escrow created successfully.',
      });

      const escrowConfig = {
        ...oracles,
        manifestUrl: manifest.url,
        manifestHash: manifest.hash,
      };

      await escrowClient.setup(escrowAddress, escrowConfig);

      setNotification({
        type: 'success',
        message: 'Escrow setup successfully.',
      });

      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      await (await tokenContract.approve(escrowAddress, fundAmount)).wait();

      await escrowClient.fund(escrowAddress, fundAmount);
      setNotification({
        type: 'success',
        message: 'Escrow funded successfully.',
      });
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { createEscrow, isLoading };
};

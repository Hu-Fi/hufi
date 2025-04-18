import { useState } from 'react';

import { ChainId, EscrowClient } from '@human-protocol/sdk';
import { ethers } from 'ethers';
import { v4 as uuidV4 } from 'uuid';
import { useAccount } from 'wagmi';

import useClientToSigner from './useClientToSigner';
import ERC20ABI from '../abi/ERC20.json';
import { ManifestUploadRequestDto } from '../api/client';
import { oracles } from '../constants/oracles';
import { getTokenAddress } from '../utils';
import { useUploadManifest } from './useUploadManifest';

const useCreateEscrow = () => {
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { chainId } = useAccount();
  const { signer, network } = useClientToSigner();
  const { mutateAsync: uploadManifest } = useUploadManifest();

  const createEscrow = async (
    fundToken: string,
    data: ManifestUploadRequestDto
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

      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const fundAmount = ethers.parseUnits(
        data.fundAmount,
        await tokenContract.decimals()
      );

      const { data: manifest } = await uploadManifest({
        ...data,
        fundAmount: fundAmount.toString(),
      });

      const escrowAddress = await escrowClient.createEscrow(
        tokenAddress,
        [signer.address],
        uuidV4()
      );
      setStepsCompleted((prev) => prev + 1);

      await (await tokenContract.approve(escrowAddress, fundAmount)).wait();
      setStepsCompleted((prev) => prev + 1);
      await escrowClient.fund(escrowAddress, fundAmount);
      setStepsCompleted((prev) => prev + 1);

      const escrowConfig = {
        ...oracles,
        manifestUrl: manifest.url,
        manifestHash: manifest.hash,
      };

      await escrowClient.setup(escrowAddress, escrowConfig);
      setStepsCompleted((prev) => prev + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return { createEscrow, isLoading, stepsCompleted };
};

export default useCreateEscrow;

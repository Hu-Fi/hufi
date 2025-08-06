import { useState } from 'react';

import { EscrowClient } from '@human-protocol/sdk';
import { ethers } from 'ethers';
import { v4 as uuidV4 } from 'uuid';
import { useChainId } from 'wagmi';

import useClientToSigner from './useClientToSigner';
import ERC20ABI from '../abi/ERC20.json';
import { oracles } from '../constants';
import { EscrowCreateDto, ManifestUploadDto } from '../types';
import { getTokenAddress } from '../utils';

const calculateManifestHash = async (manifest: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(manifest);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const useCreateEscrow = () => {
  const [escrowAddress, setEscrowAddress] = useState('');
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const chainId = useChainId();
  const { signer, network } = useClientToSigner();

  const createEscrow = async (data: EscrowCreateDto) => {
    if (!signer || !network) {
      return;
    }

    setIsLoading(true);

    try {
      const escrowClient = await EscrowClient.build(signer);
      const tokenAddress = getTokenAddress(chainId, data.fund_token);

      if (!tokenAddress?.length) {
        throw new Error('Fund token is not supported.');
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const fundAmount = ethers.parseUnits(
        data.fund_amount.toString(),
        await tokenContract.decimals()
      );

      const manifest: ManifestUploadDto = {
        type: 'MARKET_MAKING',
        exchange: data.exchange,
        daily_volume_target: data.daily_volume_target,
        pair: data.pair,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date.toISOString(),
      };

      const escrowAddress = await escrowClient.createEscrow(
        tokenAddress,
        [signer.address],
        uuidV4()
      );
      setStepsCompleted((prev) => prev + 1);
      setEscrowAddress(escrowAddress);

      await escrowClient.fund(escrowAddress, fundAmount);
      setStepsCompleted((prev) => prev + 1);

      const manifestString = JSON.stringify(manifest);
      const manifestHash = await calculateManifestHash(manifestString);
      
      const escrowConfig = {
        ...oracles,
        manifestUrl: manifestString,
        manifestHash: manifestHash,
      };

      await escrowClient.setup(escrowAddress, escrowConfig);
      setStepsCompleted((prev) => prev + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return { escrowAddress, createEscrow, isLoading, stepsCompleted };
};

export default useCreateEscrow;

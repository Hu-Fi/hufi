import { useCallback, useState } from 'react';

import { type ChainId, NETWORKS } from '@human-protocol/sdk';
import { ethers } from 'ethers';

import ERC20ABI from '@/abi/ERC20.json';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useNetwork } from '@/providers/NetworkProvider';
import { getTokenAddress } from '@/utils';

import useRetrieveSigner from './useRetrieveSigner';

type UseTokenAllowanceReturn = {
  allowance: string | null;
  isLoading: boolean;
  error: Error | null;
  fetchAllowance: (tokenSymbol: string) => Promise<string | null>;
  approve: (tokenSymbol: string, amount: string) => Promise<boolean>;
  reset: () => void;
};

export const useTokenAllowance = (): UseTokenAllowanceReturn => {
  const [allowance, setAllowance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { activeAddress } = useActiveAccount();
  const { appChainId } = useNetwork();
  const { signer } = useRetrieveSigner();

  const allowanceSpender = NETWORKS[appChainId as ChainId]?.factoryAddress;

  const fetchAllowance = useCallback(
    async (fundToken: string): Promise<string | null> => {
      if (!signer || !activeAddress) {
        setError(new Error('Wallet is not connected'));
        return null;
      }

      if (!allowanceSpender) {
        setError(new Error('Chain is not supported'));
        return null;
      }

      const tokenAddress = getTokenAddress(appChainId, fundToken);
      if (!tokenAddress) {
        setError(new Error('Token is not supported on this chain'));
        return null;
      }

      try {
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20ABI,
          signer
        );
        const tokenDecimals = await tokenContract.decimals();
        const currentAllowance = await tokenContract.allowance(
          activeAddress,
          allowanceSpender
        );
        const isUnlimited = BigInt(currentAllowance) >= ethers.MaxUint256 / 2n;
        const _allowance = isUnlimited
          ? 'unlimited'
          : ethers.formatUnits(currentAllowance, tokenDecimals);
        setAllowance(_allowance);
        return _allowance;
      } catch (err) {
        console.error('Error fetching allowance:', err);
        return null;
      }
    },
    [signer, activeAddress, appChainId, allowanceSpender]
  );

  const approve = useCallback(
    async (fundToken: string, fundAmount: string): Promise<boolean> => {
      if (!signer || !activeAddress) {
        setError(new Error('Wallet is not connected'));
        return false;
      }

      if (!allowanceSpender) {
        setError(new Error('Chain is not supported'));
        return false;
      }

      const tokenAddress = getTokenAddress(appChainId, fundToken);
      if (!tokenAddress) {
        setError(new Error('Token is not supported on this chain'));
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20ABI,
          signer
        );
        const tokenDecimals = await tokenContract.decimals();
        const parsedFundAmount =
          fundAmount === 'max'
            ? ethers.MaxUint256
            : ethers.parseUnits(fundAmount, tokenDecimals);
        const tx = await tokenContract.approve(
          allowanceSpender,
          parsedFundAmount
        );
        await tx.wait();

        const newAllowance = await tokenContract.allowance(
          activeAddress,
          allowanceSpender
        );
        const isUnlimited = BigInt(newAllowance) >= ethers.MaxUint256 / 2n;
        const _allowance = isUnlimited
          ? 'unlimited'
          : ethers.formatUnits(newAllowance, tokenDecimals);
        setAllowance(_allowance);
        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to approve tokens');
        setError(error);
        console.error('Error approving tokens:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [signer, activeAddress, appChainId, allowanceSpender]
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    allowance,
    isLoading,
    error,
    fetchAllowance,
    approve,
    reset,
  };
};

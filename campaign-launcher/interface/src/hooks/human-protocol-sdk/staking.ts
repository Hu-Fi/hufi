import { useEffect, useState } from 'react';

import {
  ChainId,
  ILeader,
  OperatorUtils,
  StakingClient,
} from '@human-protocol/sdk';
import { parseUnits } from 'ethers';
import { useAccount } from 'wagmi';

import { useClientToSigner } from './common';
import { useNotification, useWalletBalance } from '../';

export const useStakeHMT = () => {
  const { signer } = useClientToSigner();
  const { setNotification } = useNotification();
  const walletBalance = useWalletBalance();
  const { fetchLeader } = useLeader();

  return async (amount: number) => {
    if (!signer) {
      return;
    }

    const amountInWei = parseUnits(amount.toString(), walletBalance.decimals);

    try {
      const stakingClient = await StakingClient.build(signer);

      await stakingClient.approveStake(amountInWei);

      setNotification({
        type: 'success',
        message: 'Staking approved.',
      });

      await stakingClient.stake(amountInWei);

      setNotification({
        type: 'success',
        message: 'Staked HMT successfully.',
      });

      fetchLeader();
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });
    }
  };
};

export const useLeader = () => {
  const { chainId } = useAccount();
  const { signer } = useClientToSigner();
  const { setNotification } = useNotification();
  const [leader, setLeader] = useState<ILeader | null>();
  const [loading, setLoading] = useState(false);

  const fetchLeader = async () => {
    if (!signer) {
      return;
    }

    setLoading(true);
    try {
      const leader = await OperatorUtils.getLeader(
        chainId as ChainId,
        signer?.address
      );

      setLeader(leader);
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });

      setLeader(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeader();
  }, [signer]);

  return { leader, loading, fetchLeader };
};

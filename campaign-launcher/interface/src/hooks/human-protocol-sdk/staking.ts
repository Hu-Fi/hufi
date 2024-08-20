import { StakingClient } from '@human-protocol/sdk';
import { parseUnits } from 'ethers';

import { useClientToSigner } from './common';
import { useNotification, useWalletBalance } from '../';
import { useLeader } from '../../api/leader';

export const useStakeHMT = () => {
  const { signer } = useClientToSigner();
  const { setNotification } = useNotification();
  const walletBalance = useWalletBalance();
  const { refetch } = useLeader();

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

      refetch();
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });
    }
  };
};

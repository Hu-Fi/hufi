import { useEffect, useState } from 'react';

import { ChainId, StakerInfo, StakingClient } from '@human-protocol/sdk';
import { Eip1193Provider, ethers } from 'ethers';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import ERC20ABI from '../abi/ERC20.json';
import { formatTokenAmount, getSupportedChainIds, getTokenAddress } from '../utils';

export const useStake = () => {
  const [stakingData, setStakingData] = useState<StakerInfo | null>(null);
  const [stakingClient, setStakingClient] = useState<StakingClient | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const { address, connector, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const appChainId = useChainId();

  useEffect(() => {
    const initStakingClient = async () => {
      try {
        if (walletClient && address && connector) {
          checkSupportedChain();
          const eeip193Provider = await connector?.getProvider();
          const provider = new ethers.BrowserProvider(
            eeip193Provider as Eip1193Provider
          );
          const signer = await provider.getSigner();
          const client = await StakingClient.build(signer);
          setStakingClient(client);

          try {
            const stakingTokenAddress = getTokenAddress(appChainId as ChainId, 'hmt');
            if (stakingTokenAddress) {
              const contract = new ethers.Contract(stakingTokenAddress, ERC20ABI, provider);
              const decimals = await contract.decimals();
              setTokenDecimals(Number(decimals));
            } else {
              setTokenDecimals(18);
            }
          } catch (e) {
            setTokenDecimals(18);
          }

          await fetchStakingData(client);
        }
      } catch (error) {
        console.error(error);
        resetData();
      }
    };

    initStakingClient();
  }, [walletClient, address, chainId, connector, appChainId]);

  const checkSupportedChain = () => {
    const isSupportedChain = getSupportedChainIds().includes(appChainId as ChainId);
    if (!isSupportedChain) {
      resetData();
      throw new Error(
        'Unsupported chain. Please switch to a supported network.'
      );
    }
  };

  const resetData = () => {
    setStakingData(null);
    setStakingClient(null);
  };

  const fetchStakingData = async (stakingClient: StakingClient) => {
    checkSupportedChain();
    try {
      const stakingInfo = await stakingClient.getStakerInfo(address!);
      setStakingData(stakingInfo);
      return stakingInfo;
    } catch (error) {
      console.error('Error fetching staking data: ', error);
      return null;
    }
  };

  const refetchStakingData = async () => {
    if (stakingClient && address) {
      const info = await fetchStakingData(stakingClient);
      const formatted = formatTokenAmount(Number(info?.stakedAmount) || 0, tokenDecimals);
      return formatted;
    }
    return 0;
  };

  return {
    stakedAmount: formatTokenAmount(Number(stakingData?.stakedAmount) || 0, tokenDecimals),
    refetchStakingData
  };
};

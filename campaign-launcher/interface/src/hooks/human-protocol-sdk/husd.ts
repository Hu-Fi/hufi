import { ChainId } from '@human-protocol/sdk';
import { ethers, parseUnits } from 'ethers';
import { useChainId } from 'wagmi';

import { useClientToSigner } from './common';
import { useNotification } from '../';
import ERC20ABI from '../../abi/ERC20.json';
import HumanUSDABI from '../../abi/HumanUSD.json';
import { useUploadManifest } from '../../api/manifest';
import {
  HUSD_CONTRACT_ADDRESS,
  HUSD_MARKET_MAKING_CAMPAIGN_DURATION,
  HUSD_MARKET_MAKING_CAMPAIGN_EXCHANGES,
  HUSD_MARKET_MAKING_CAMPAIGN_FUND_AMOUNT,
  USDT_CONTRACT_ADDRESS,
} from '../../constants';

export const useMintHUSD = () => {
  const chainId = useChainId();
  const { signer } = useClientToSigner();
  const { setNotification } = useNotification();
  const { mutateAsync: uploadManifest } = useUploadManifest();

  return async (amount: number) => {
    if (
      !signer ||
      !HUSD_CONTRACT_ADDRESS[chainId as ChainId] ||
      !USDT_CONTRACT_ADDRESS[chainId as ChainId]
    ) {
      return;
    }

    const husdContract = new ethers.Contract(
      HUSD_CONTRACT_ADDRESS[chainId as ChainId]!,
      HumanUSDABI,
      signer
    );

    const usdtContract = new ethers.Contract(
      USDT_CONTRACT_ADDRESS[chainId as ChainId]!,
      ERC20ABI,
      signer
    );

    const amountInWei = parseUnits(
      amount.toString(),
      await husdContract.decimals()
    );

    const campaignManifest = {
      chainId,
      requesterAddress: HUSD_CONTRACT_ADDRESS[chainId as ChainId]!,
      exchangeName:
        HUSD_MARKET_MAKING_CAMPAIGN_EXCHANGES[
          Math.floor(
            Math.random() * HUSD_MARKET_MAKING_CAMPAIGN_EXCHANGES.length
          )
        ],
      token: await husdContract.symbol(),
      fundAmount: +ethers
        .parseEther(HUSD_MARKET_MAKING_CAMPAIGN_FUND_AMOUNT)
        .toString(),
      startDate: new Date().toISOString(),
      duration: HUSD_MARKET_MAKING_CAMPAIGN_DURATION,
    };

    const { data: manifest } = await uploadManifest(campaignManifest);

    try {
      await usdtContract.approve(
        HUSD_CONTRACT_ADDRESS[chainId as ChainId]!,
        amountInWei
      );

      setNotification({
        type: 'success',
        message: 'USDT approved.',
      });

      await husdContract.mint(
        await signer.getAddress(),
        amountInWei,
        manifest.url,
        manifest.hash
      );

      setNotification({
        type: 'success',
        message: 'Minted HUSD successfully.',
      });
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });
    }
  };
};
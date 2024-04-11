import { useEffect, useMemo, useState } from 'react';

import {
  ChainId,
  EscrowClient,
  EscrowUtils,
  NETWORKS,
  StakingClient,
} from '@human-protocol/sdk';
import { EscrowData } from '@human-protocol/sdk/dist/graphql';
import { parseUnits } from 'ethers';
import { v4 as uuidV4 } from 'uuid';
import { Config, useChainId, useConnectorClient } from 'wagmi';

import { useNotification, useWalletBalance } from '.';
import {
  ManifestDto,
  ManifestUploadResponseDto,
} from '../api/client/data-contracts';
import { useDownloadManifest } from '../api/manifest';
import { oracles } from '../config/escrow';
import { clientToSigner } from '../utils/wagmi-ethers';


export const useClientToSigner = () => {
  const chainId = useChainId();
  const { data: client } = useConnectorClient<Config>({ chainId });

  return useMemo(() => {
    let network = undefined;
    let signer = undefined;

    if (!client) {
      return {
        network,
        signer,
      };
    }

    network = NETWORKS[chainId as ChainId];
    signer = clientToSigner(client);

    return {
      network,
      signer,
    };
  }, [client]);
};

export const useCreateEscrow = () => {
  const { signer, network } = useClientToSigner();
  const { setNotification } = useNotification();

  return async (manifest: ManifestUploadResponseDto, amount: number) => {
    try {
      if (!signer || !network) {
        return;
      }

      const escrowClient = await EscrowClient.build(signer);

      const escrowAddress = await escrowClient.createEscrow(
        network.hmtAddress,
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

      const fundAmount = parseUnits(amount.toString(), 'ether');
      await escrowClient.fund(escrowAddress, BigInt(fundAmount));
      setNotification({
        type: 'success',
        message: 'Escrow funded successfully.',
      });
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });
    }
  };
};

export const useStakeHMT = () => {
  const { signer } = useClientToSigner();
  const { setNotification } = useNotification();
  const walletBalance = useWalletBalance();

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
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });
    }
  };
};

export type EscrowDataExtended = EscrowData &
  Omit<ManifestDto, 'token'> & {
    symbol: string;
  };

export const useCampaigns = () => {
  const chainId = useChainId();
  const { setNotification } = useNotification();
  const { mutateAsync } = useDownloadManifest();

  const [campaigns, setCampaigns] = useState<EscrowDataExtended[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const campaigns = await EscrowUtils.getEscrows({
        networks: [chainId as ChainId],
        exchangeOracle: oracles.exchangeOracle,
      });

      const campaignsWithManifest: Array<EscrowDataExtended | undefined> =
        await Promise.all(
          campaigns.map(async (campaign) => {
            let manifest;

            try {
              manifest = await mutateAsync(campaign.manifestHash || '').then(
                (res) => res.data
              );
            } catch {
              manifest = undefined;
            }

            if (!manifest) {
              return undefined;
            }

            return {
              ...manifest,
              ...campaign,
              symbol: manifest.token,
            };
          })
        );

      setCampaigns(
        campaignsWithManifest.filter(
          (campaign) => campaign !== undefined
        ) as EscrowDataExtended[]
      );
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return { campaigns, loading };
};

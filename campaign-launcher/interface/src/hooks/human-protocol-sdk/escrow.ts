import { useEffect, useState } from 'react';

import { ChainId, EscrowClient, EscrowUtils } from '@human-protocol/sdk';
import { EscrowData } from '@human-protocol/sdk/dist/graphql';
import { parseUnits } from 'ethers';
import { v4 as uuidV4 } from 'uuid';
import { useChainId } from 'wagmi';

import { useClientToSigner } from './common';
import { useNotification } from '../';
import {
  ManifestDto,
  ManifestUploadResponseDto,
} from '../../api/client/data-contracts';
import { useDownloadManifest } from '../../api/manifest';
import { oracles } from '../../config/escrow';

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

export type CampaignData = EscrowData &
  Omit<ManifestDto, 'token'> & {
    symbol: string;
  };

export const useCampaigns = () => {
  const chainId = useChainId();
  const { setNotification } = useNotification();
  const { mutateAsync } = useDownloadManifest();

  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const campaigns = await EscrowUtils.getEscrows({
        networks: [chainId as ChainId],
        exchangeOracle: oracles.exchangeOracle,
      });

      const campaignsWithManifest: Array<CampaignData | undefined> =
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
        ) as CampaignData[]
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

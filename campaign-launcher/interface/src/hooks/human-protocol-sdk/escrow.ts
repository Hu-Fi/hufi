import { useEffect, useState } from 'react';

import { ChainId, EscrowClient, EscrowUtils } from '@human-protocol/sdk';
import { EscrowData } from '@human-protocol/sdk/dist/graphql';
import { v4 as uuidV4 } from 'uuid';
import { useAccount } from 'wagmi';

import { useClientToSigner } from './common';
import { useNotification } from '../';
import { ManifestUploadResponseDto } from '../../api/client/Api';
import { oracles } from '../../config/escrow';
import { ManifestDto } from '../../types/manifest';
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

export type CampaignData = EscrowData &
  Omit<ManifestDto, 'token'> & {
    symbol: string;
  };

export const useCampaigns = (chainId: ChainId) => {
  const { setNotification } = useNotification();

  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const campaigns = await EscrowUtils.getEscrows({
        chainId,
        recordingOracle: oracles.recordingOracle,
        reputationOracle: oracles.reputationOracle,
      });

      const campaignsWithManifest: Array<CampaignData | undefined> =
        await Promise.all(
          campaigns.map(async (campaign) => {
            let manifest;

            try {
              if (campaign.manifestUrl) {
                // @dev Temporary fix to handle http/https issue
                const url = campaign.manifestUrl.replace(
                  'http://storage.googleapis.com:80',
                  'https://storage.googleapis.com'
                );
                manifest = await fetch(url).then((res) => res.json());
              }
            } catch {
              manifest = undefined;
            }

            if (!manifest) {
              return undefined;
            }

            return {
              ...manifest,
              ...campaign,
              symbol: manifest.token.toLowerCase(),
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
  }, [chainId]);

  return { campaigns, loading };
};

export const useCampaign = (chainId: ChainId, address: string) => {
  const { setNotification } = useNotification();

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCampaign = async () => {
    setLoading(true);
    try {
      const campaign = await EscrowUtils.getEscrow(chainId, address);

      let manifest;

      try {
        if (campaign.manifestUrl) {
          // @dev Temporary fix to handle http/https issue
          const url = campaign.manifestUrl.replace(
            'http://storage.googleapis.com:80',
            'https://storage.googleapis.com'
          );
          manifest = await fetch(url).then((res) => res.json());
        }
      } catch {
        manifest = undefined;
      }

      if (!manifest) {
        return undefined;
      }

      setCampaign({
        ...manifest,
        ...campaign,
        symbol: manifest.token.toLowerCase(),
      });
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
    fetchCampaign();
  }, [chainId, address]);

  return { campaign, loading };
};

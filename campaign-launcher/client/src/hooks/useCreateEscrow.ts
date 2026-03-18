import { useCallback, useState } from 'react';

import { EscrowClient, type IEscrowConfig } from '@human-protocol/sdk';
import { ethers } from 'ethers';

import ERC20ABI from '@/abi/ERC20.json';
import { launcherApi } from '@/api';
import { oracles } from '@/constants';
import { useNetwork } from '@/providers/NetworkProvider';
import { useSignerContext } from '@/providers/SignerProvider';
import {
  CampaignType,
  type ManifestUploadDto,
  type CampaignFormValues,
} from '@/types';
import { calculateHash, getTokenAddress } from '@/utils';

type CreateEscrowMutationResult = {
  escrowAddress: string;
  tokenDecimals: number;
  exchangeOracleFee: bigint;
  recordingOracleFee: bigint;
  reputationOracleFee: bigint;
};

type CreateEscrowMutationState = {
  data: CreateEscrowMutationResult | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
  mutate: (variables: CampaignFormValues) => Promise<void>;
  reset: () => void;
};

const createManifest = (data: CampaignFormValues): ManifestUploadDto => {
  const baseManifest = {
    exchange: data.exchange,
    start_date: data.start_date.toISOString(),
    end_date: data.end_date.toISOString(),
  };

  switch (data.type) {
    case CampaignType.MARKET_MAKING:
      return {
        ...baseManifest,
        type: data.type,
        pair: data.pair,
        daily_volume_target: Number(data.daily_volume_target),
      };
    case CampaignType.HOLDING:
      return {
        ...baseManifest,
        type: data.type,
        symbol: data.symbol,
        daily_balance_target: Number(data.daily_balance_target),
      };
    case CampaignType.THRESHOLD:
      return {
        ...baseManifest,
        type: data.type,
        symbol: data.symbol,
        minimum_balance_target: Number(data.minimum_balance_target),
      };
    default: {
      const _never: never = data;
      return _never;
    }
  }
};

const useCreateEscrow = (): CreateEscrowMutationState => {
  const [data, setData] = useState<CreateEscrowMutationResult | undefined>(
    undefined
  );
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const { appChainId } = useNetwork();
  const { signer } = useSignerContext();

  const isError = !!error;
  const isSuccess = !!data && !error && !isLoading;
  const isIdle = !isLoading && !error && !data;

  const createEscrowMutation = useCallback(
    async (variables: CampaignFormValues) => {
      if (!signer) {
        throw new Error('Escrow client not initialized');
      }

      let escrowClient: EscrowClient;

      try {
        escrowClient = await EscrowClient.build(signer);
      } catch (e) {
        console.error('Failed to initialize escrow client', e);
        throw new Error('Failed to initialize escrow client');
      }

      const tokenAddress = getTokenAddress(appChainId, variables.fund_token);
      if (!tokenAddress?.length) {
        throw new Error('Fund token is not supported.');
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);

      const _tokenDecimals = await tokenContract.decimals();
      const tokenDecimals = Number(_tokenDecimals) || 18;

      const fundAmount = ethers.parseUnits(
        variables.fund_amount.toString(),
        tokenDecimals
      );

      const manifest = createManifest(variables);

      try {
        /**
         * We display campaign data after creation based on the form values
         * and result of this operation, and have to include oracles fees there,
         * so retrieve it here to keep the whole flow simple and do it before escrow creation
         * in order to avoid confusion in case of failure (if we do it after escrow creation,
         * we might end up in a state when escrow is created, but campaign creation failed
         * due to oracle fee retrieval failure).
         */
        const oracleFees = await launcherApi.getOracleFees(appChainId);

        const manifestString = JSON.stringify(manifest);
        const manifestHash = await calculateHash(manifestString);

        const escrowConfig: IEscrowConfig = {
          exchangeOracle: oracles.exchangeOracle,
          recordingOracle: oracles.recordingOracle,
          reputationOracle: oracles.reputationOracle,
          manifest: manifestString,
          manifestHash: manifestHash,
        };

        const _escrowAddress = await escrowClient.createFundAndSetupEscrow(
          tokenAddress,
          fundAmount,
          'hufi-campaign-launcher',
          escrowConfig
        );

        return {
          escrowAddress: _escrowAddress,
          tokenDecimals,
          exchangeOracleFee: BigInt(oracleFees.exchange_oracle_fee),
          recordingOracleFee: BigInt(oracleFees.recording_oracle_fee),
          reputationOracleFee: BigInt(oracleFees.reputation_oracle_fee),
        };
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    [signer, appChainId]
  );

  const mutate = useCallback(
    async (variables: CampaignFormValues) => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await createEscrowMutation(variables);

        setData(result);
      } catch (e) {
        const err =
          e instanceof Error ? e : new Error('Unknown error occurred');
        setError(err);
        setData(undefined);
      } finally {
        setIsLoading(false);
      }
    },
    [createEscrowMutation]
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(undefined);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    isIdle,
    mutate,
    reset,
  };
};

export default useCreateEscrow;

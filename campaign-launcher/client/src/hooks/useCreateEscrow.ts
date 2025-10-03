import { useCallback, useState } from 'react';

import { EscrowClient } from '@human-protocol/sdk';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { v4 as uuidV4 } from 'uuid';

import useRetrieveSigner from './useRetrieveSigner';
import ERC20ABI from '../abi/ERC20.json';
import { launcherApi } from '../api';
import { oracles } from '../constants';
import { useNetwork } from '../providers/NetworkProvider';
import { ManifestUploadDto, CampaignFormValues, CampaignType } from '../types';
import { calculateHash, getTokenAddress } from '../utils';

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
  stepsCompleted: number;
  mutate: (variables: CampaignFormValues) => Promise<void>;
  reset: () => void;
};

const transformManifestTime = (
  date: Date,
  isStartDate: boolean = true
): string => {
  const pickedDate = dayjs(date);
  const localDate = isStartDate
    ? pickedDate.isSame(dayjs(), 'day')
      ? pickedDate
      : pickedDate.startOf('day')
    : pickedDate.endOf('day');
  return localDate.toISOString();
};

const createManifest = (data: CampaignFormValues): ManifestUploadDto => {
  const baseManifest = {
    exchange: data.exchange,
    start_date: transformManifestTime(data.start_date, true),
    end_date: transformManifestTime(data.end_date, false),
  };

  switch (data.type) {
    case CampaignType.MARKET_MAKING:
      return {
        ...baseManifest,
        type: data.type,
        pair: data.pair,
        daily_volume_target: data.daily_volume_target,
      };
    case CampaignType.HOLDING:
      return {
        ...baseManifest,
        type: data.type,
        symbol: data.symbol,
        daily_balance_target: data.daily_balance_target,
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
  const [stepsCompleted, setStepsCompleted] = useState(0);

  const { appChainId } = useNetwork();
  const { signer } = useRetrieveSigner();

  const isError = !!error;
  const isSuccess = !!data && !error && !isLoading;
  const isIdle = !isLoading && !error && !data;

  const createEscrowMutation = useCallback(
    async (variables: CampaignFormValues) => {
      if (!signer) {
        return;
      }

      setStepsCompleted(0);

      try {
        const escrowClient = await EscrowClient.build(signer);
        const tokenAddress = getTokenAddress(appChainId, variables.fund_token);
        if (!tokenAddress?.length) {
          throw new Error('Fund token is not supported.');
        }

        let _exchangeOracleFee: string;
        let _recordingOracleFee: string;
        let _reputationOracleFee: string;
        try {
          const oracleFees = await launcherApi.getOracleFees(appChainId);
          _exchangeOracleFee = oracleFees.exchange_oracle_fee;
          _recordingOracleFee = oracleFees.recording_oracle_fee;
          _reputationOracleFee = oracleFees.reputation_oracle_fee;
        } catch (e) {
          console.error('Error getting oracle fees', e);
          throw e;
        }

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20ABI,
          signer
        );
        const tokenDecimals = await tokenContract.decimals();
        const _tokenDecimals = Number(tokenDecimals) || 18;

        const fundAmount = ethers.parseUnits(
          variables.fund_amount.toString(),
          tokenDecimals
        );

        const manifest = createManifest(variables);

        const escrowAddress = await escrowClient.createEscrow(
          tokenAddress,
          [signer.address],
          uuidV4()
        );
        setStepsCompleted(1);

        await escrowClient.fund(escrowAddress, fundAmount);
        setStepsCompleted(2);

        const manifestString = JSON.stringify(manifest);
        const manifestHash = await calculateHash(manifestString);

        const escrowConfig = {
          exchangeOracle: oracles.exchangeOracle,
          recordingOracle: oracles.recordingOracle,
          reputationOracle: oracles.reputationOracle,
          exchangeOracleFee: BigInt(_exchangeOracleFee),
          recordingOracleFee: BigInt(_recordingOracleFee),
          reputationOracleFee: BigInt(_reputationOracleFee),
          manifest: manifestString,
          manifestHash: manifestHash,
        };

        await escrowClient.setup(escrowAddress, escrowConfig);
        setStepsCompleted(3);

        const result = {
          escrowAddress,
          tokenDecimals: _tokenDecimals,
          exchangeOracleFee: BigInt(_exchangeOracleFee),
          recordingOracleFee: BigInt(_recordingOracleFee),
          reputationOracleFee: BigInt(_reputationOracleFee),
        };

        return result;
      } catch (e) {
        console.error(e);
        setStepsCompleted(0);
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
    setStepsCompleted(0);
  }, []);

  return {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    isIdle,
    stepsCompleted,
    mutate,
    reset,
  };
};

export default useCreateEscrow;

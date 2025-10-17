import { useCallback, useRef, useState } from 'react';

import { EscrowClient } from '@human-protocol/sdk';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { v4 as uuidV4 } from 'uuid';

import ERC20ABI from '@/abi/ERC20.json';
import { launcherApi } from '@/api';
import { oracles } from '@/constants';
import { useNetwork } from '@/providers/NetworkProvider';
import {
  CampaignType,
  type ManifestUploadDto,
  type CampaignFormValues,
} from '@/types';
import { calculateHash, getTokenAddress } from '@/utils';

import useRetrieveSigner from './useRetrieveSigner';

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

type EscrowState = {
  escrowAddress: string;
  exchangeOracleFee: string;
  recordingOracleFee: string;
  reputationOracleFee: string;
};

const transformManifestTime = (date: Date, isStartDate = true): string => {
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

const initialEscrowState: EscrowState = {
  escrowAddress: '',
  exchangeOracleFee: '',
  recordingOracleFee: '',
  reputationOracleFee: '',
};

const useCreateEscrow = (): CreateEscrowMutationState => {
  const [data, setData] = useState<CreateEscrowMutationResult | undefined>(
    undefined
  );
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState(0);

  const escrowState = useRef<EscrowState>(initialEscrowState);

  const { appChainId } = useNetwork();
  const { signer } = useRetrieveSigner();

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

      let _stepsCompleted = stepsCompleted;

      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);

      const _tokenDecimals = await tokenContract.decimals();
      const tokenDecimals = Number(_tokenDecimals) || 18;

      const fundAmount = ethers.parseUnits(
        variables.fund_amount.toString(),
        tokenDecimals
      );

      const manifest = createManifest(variables);

      try {
        if (_stepsCompleted < 1) {
          /*
          Before creating the escrow, we need to get the oracle fees in order to
          make sure the backend won't interrupt the process and users won't lose their funds
        */
          const oracleFees = await launcherApi.getOracleFees(appChainId);
          const _escrowAddress = await escrowClient.createEscrow(
            tokenAddress,
            [signer.address],
            uuidV4()
          );

          escrowState.current.escrowAddress = _escrowAddress;
          escrowState.current.exchangeOracleFee =
            oracleFees.exchange_oracle_fee;
          escrowState.current.recordingOracleFee =
            oracleFees.recording_oracle_fee;
          escrowState.current.reputationOracleFee =
            oracleFees.reputation_oracle_fee;

          _stepsCompleted = 1;
          setStepsCompleted(_stepsCompleted);
        }

        if (_stepsCompleted < 2) {
          await escrowClient.fund(
            escrowState.current.escrowAddress,
            fundAmount
          );
          _stepsCompleted = 2;
          setStepsCompleted(_stepsCompleted);
        }

        if (_stepsCompleted < 3) {
          const manifestString = JSON.stringify(manifest);
          const manifestHash = await calculateHash(manifestString);

          const escrowConfig = {
            exchangeOracle: oracles.exchangeOracle,
            recordingOracle: oracles.recordingOracle,
            reputationOracle: oracles.reputationOracle,
            exchangeOracleFee: BigInt(escrowState.current.exchangeOracleFee),
            recordingOracleFee: BigInt(escrowState.current.recordingOracleFee),
            reputationOracleFee: BigInt(
              escrowState.current.reputationOracleFee
            ),
            manifest: manifestString,
            manifestHash: manifestHash,
          };

          await escrowClient.setup(
            escrowState.current.escrowAddress,
            escrowConfig
          );
          _stepsCompleted = 3;
          setStepsCompleted(_stepsCompleted);
        }

        const result = {
          escrowAddress: escrowState.current.escrowAddress,
          tokenDecimals,
          exchangeOracleFee: BigInt(escrowState.current.exchangeOracleFee),
          recordingOracleFee: BigInt(escrowState.current.recordingOracleFee),
          reputationOracleFee: BigInt(escrowState.current.reputationOracleFee),
        };

        return result;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    [signer, appChainId, stepsCompleted]
  );

  const mutate = useCallback(
    async (variables: CampaignFormValues) => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await createEscrowMutation(variables);
        setData(result);
      } catch (e) {
        console.error(e);
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
    escrowState.current = initialEscrowState;
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

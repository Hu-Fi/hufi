import { useCallback, useEffect, useState } from 'react';

import { EscrowClient } from '@human-protocol/sdk';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { v4 as uuidV4 } from 'uuid';

import useRetrieveSigner from './useRetrieveSigner';
import ERC20ABI from '../abi/ERC20.json';
import { launcherApi } from '../api';
import { oracles } from '../constants';
import { useNetwork } from '../providers/NetworkProvider';
import { EscrowCreateDto, ManifestUploadDto } from '../types';
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
  mutate: (variables: EscrowCreateDto) => Promise<void>;
  reset: () => void;
};

type EscrowState = {
  escrowAddress: string;
  exchangeOracleFee: string;
  recordingOracleFee: string;
  reputationOracleFee: string;
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

const initialEscrowState: EscrowState = {
  escrowAddress: '',
  exchangeOracleFee: '',
  recordingOracleFee: '',
  reputationOracleFee: '',
};

const useCreateEscrow = (): CreateEscrowMutationState => {
  const [data, setData] = useState<CreateEscrowMutationResult | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [escrowClient, setEscrowClient] = useState<EscrowClient | undefined>(undefined);
  const [escrowState, setEscrowState] = useState<EscrowState>(initialEscrowState);

  const { appChainId } = useNetwork();
  const { signer } = useRetrieveSigner();

  const isError = !!error;
  const isSuccess = !!data && !error && !isLoading;
  const isIdle = !isLoading && !error && !data;

  useEffect(() => {
    const initEscrowClient = async () => {
      if (signer) {
        try {
          const _escrowClient = await EscrowClient.build(signer);
          setEscrowClient(_escrowClient);
        } catch (e) {
          console.error('Failed to initialize escrow client', e);
          setError(e instanceof Error ? e : new Error('Failed to initialize escrow client'));
        }
      }
    };

    initEscrowClient();
  }, [signer]);

  const createEscrowMutation = useCallback(async (variables: EscrowCreateDto) => {
    if (!escrowClient || !signer) {
      throw new Error('Escrow client not initialized');
    }

    const tokenAddress = getTokenAddress(appChainId, variables.fund_token);
    if (!tokenAddress?.length) {
      throw new Error('Fund token is not supported.');
    }

    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20ABI,
      signer
    );

    const _tokenDecimals = await tokenContract.decimals();
    const tokenDecimals = Number(_tokenDecimals) || 18;

    const fundAmount = ethers.parseUnits(
      variables.fund_amount.toString(),
      tokenDecimals
    );

    const manifest: ManifestUploadDto = {
      type: 'MARKET_MAKING',
      exchange: variables.exchange,
      daily_volume_target: variables.daily_volume_target,
      pair: variables.pair,
      start_date: transformManifestTime(variables.start_date, true),
      end_date: transformManifestTime(variables.end_date, false),
    };

    try {
      if (stepsCompleted < 1) {
        const oracleFees = await launcherApi.getOracleFees(appChainId);
        const _escrowAddress = await escrowClient.createEscrow(
          tokenAddress,
          [signer.address],
          uuidV4()
        );

        setEscrowState({
          escrowAddress: _escrowAddress,
          exchangeOracleFee: oracleFees.exchange_oracle_fee,
          recordingOracleFee: oracleFees.recording_oracle_fee,
          reputationOracleFee: oracleFees.reputation_oracle_fee,
        });
        setStepsCompleted(1);
      }

      if (stepsCompleted < 2) {
        await escrowClient.fund(escrowState.escrowAddress, fundAmount);
        setStepsCompleted(2);
      }

      if (stepsCompleted < 3) {
        const manifestString = JSON.stringify(manifest);
        const manifestHash = await calculateHash(manifestString);

        const escrowConfig = {
          exchangeOracle: oracles.exchangeOracle,
          recordingOracle: oracles.recordingOracle,
          reputationOracle: oracles.reputationOracle,
          exchangeOracleFee: BigInt(escrowState.exchangeOracleFee),
          recordingOracleFee: BigInt(escrowState.recordingOracleFee),
          reputationOracleFee: BigInt(escrowState.reputationOracleFee),
          manifest: manifestString,
          manifestHash: manifestHash,
        };

        await escrowClient.setup(escrowState.escrowAddress, escrowConfig);
        setStepsCompleted(3);
      }

      const result = {
        escrowAddress: escrowState.escrowAddress,
        tokenDecimals,
        exchangeOracleFee: BigInt(escrowState.exchangeOracleFee),
        recordingOracleFee: BigInt(escrowState.recordingOracleFee),
        reputationOracleFee: BigInt(escrowState.reputationOracleFee),
      };

      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },[signer, appChainId, escrowClient, escrowState, stepsCompleted]);

  const mutate = useCallback(async (variables: EscrowCreateDto) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const result = await createEscrowMutation(variables);
      setData(result);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Unknown error occurred');
      setError(err);
      setData(undefined);
    } finally {
      setIsLoading(false);
    }
  },[createEscrowMutation]);

  const reset = useCallback(() => {
    setData(undefined);
    setError(undefined);
    setIsLoading(false);
    setStepsCompleted(0);
    setEscrowState(initialEscrowState);
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

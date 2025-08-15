import { useCallback, useState } from 'react';

import { EscrowClient, KVStoreKeys, KVStoreUtils } from '@human-protocol/sdk';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { v4 as uuidV4 } from 'uuid';
import { useChainId } from 'wagmi';

import useClientToSigner from './useClientToSigner';
import ERC20ABI from '../abi/ERC20.json';
import { oracles } from '../constants';
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

const transformManifestTime = (date: Date, isStartDate: boolean = true): string => {
  const pickedDate = dayjs(date);
  const localDate = isStartDate
    ? (pickedDate.isSame(dayjs(), 'day') ? pickedDate : pickedDate.startOf('day'))
    : pickedDate.endOf('day');
  return localDate.toISOString();
}

const useCreateEscrow = (): CreateEscrowMutationState => {
  const [data, setData] = useState<CreateEscrowMutationResult | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState(0);
  
  const chainId = useChainId();
  const { signer, network } = useClientToSigner();

  const isError = !!error;
  const isSuccess = !!data && !error && !isLoading;
  const isIdle = !isLoading && !error && !data;

  const createEscrowMutation = useCallback(async (variables: EscrowCreateDto) => {
    if (!signer || !network) {
      return;
    }

    setStepsCompleted(0);

    try {
      const escrowClient = await EscrowClient.build(signer);
      const tokenAddress = getTokenAddress(chainId, variables.fund_token);
      if (!tokenAddress?.length) {
        throw new Error('Fund token is not supported.');
      }

      let _exchangeOracleFee: string;
      try {
        _exchangeOracleFee = await KVStoreUtils.get(chainId, oracles.exchangeOracle, KVStoreKeys.fee);
      } catch (e) {
        console.error('Error getting exchange oracle fee', e);
        throw e;
      }

      if (!_exchangeOracleFee) {
        throw new Error('Exchange oracle fee is not set.');
      }

      let _recordingOracleFee: string;
      try {
        _recordingOracleFee = await KVStoreUtils.get(chainId, oracles.recordingOracle, KVStoreKeys.fee);
      } catch (e) {
        console.error('Error getting recording oracle fee', e);
        throw e;
      }

      if (!_recordingOracleFee) {
        throw new Error('Recording oracle fee is not set.');
      }

      let _reputationOracleFee: string;
      try {
        _reputationOracleFee = await KVStoreUtils.get(chainId, oracles.reputationOracle, KVStoreKeys.fee);
      } catch (e) {
        console.error(e);
        throw e;
      }

      if (!_reputationOracleFee) {
        throw new Error('Reputation oracle fee is not set.');
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const tokenDecimals = await tokenContract.decimals();
      const _tokenDecimals = Number(tokenDecimals) || 18;
      
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
  }, [signer, network, chainId]);

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
  }, [createEscrowMutation]);

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

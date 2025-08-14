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

const transformManifestTime = (date: Date, isStartDate: boolean = true): string => {
  const pickedDate = dayjs(date);
  const localDate = isStartDate
    ? (pickedDate.isSame(dayjs(), 'day') ? pickedDate : pickedDate.startOf('day'))
    : pickedDate.endOf('day');
  return localDate.toISOString();
}

const useCreateEscrow = () => {
  const [escrowAddress, setEscrowAddress] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [exchangeOracleFee, setExchangeOracleFee] = useState(BigInt(0));
  const [recordingOracleFee, setRecordingOracleFee] = useState(BigInt(0));
  const [reputationOracleFee, setReputationOracleFee] = useState(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const chainId = useChainId();
  const { signer, network } = useClientToSigner();

  const clearError = () => {
    setIsError(false);
  }

  const createEscrow = useCallback(async (data: EscrowCreateDto) => {
    if (!signer || !network) {
      return;
    }

    clearError();
    setIsLoading(true);
    setStepsCompleted(0);
    setEscrowAddress('');

    try {
      const escrowClient = await EscrowClient.build(signer);
      const tokenAddress = getTokenAddress(chainId, data.fund_token);

      if (!tokenAddress?.length) {
        throw new Error('Fund token is not supported.');
      }

      let _exchangeOracleFee: string;
      try {
        _exchangeOracleFee = await KVStoreUtils.get(chainId, oracles.exchangeOracle, KVStoreKeys.fee);
        setExchangeOracleFee(BigInt(_exchangeOracleFee));
      } catch (e) {
        console.error('Error getting exchange oracle fee', e);
        throw e
      }

      if (!_exchangeOracleFee) {
        throw new Error('Exchange oracle fee is not set.');
      }

      let _recordingOracleFee: string;
      try {
        _recordingOracleFee = await KVStoreUtils.get(chainId, oracles.recordingOracle, KVStoreKeys.fee);
        setRecordingOracleFee(BigInt(_recordingOracleFee));
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
        setReputationOracleFee(BigInt(_reputationOracleFee));
      } catch (e) {
        console.error(e);
        throw e;
      }

      if (!_reputationOracleFee) {
        throw new Error('Reputation oracle fee is not set.');
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const tokenDecimals = await tokenContract.decimals();
      setTokenDecimals(Number(tokenDecimals) || 18);
      const fundAmount = ethers.parseUnits(
        data.fund_amount.toString(),
        tokenDecimals
      );

      const manifest: ManifestUploadDto = {
        type: 'MARKET_MAKING',
        exchange: data.exchange,
        daily_volume_target: data.daily_volume_target,
        pair: data.pair,
        start_date: transformManifestTime(data.start_date, true),
        end_date: transformManifestTime(data.end_date, false),
      };

      const escrowAddress = await escrowClient.createEscrow(
        tokenAddress,
        [signer.address],
        uuidV4()
      );
      setStepsCompleted((prev) => prev + 1);
      setEscrowAddress(escrowAddress);

      await escrowClient.fund(escrowAddress, fundAmount);
      setStepsCompleted((prev) => prev + 1);

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
      setStepsCompleted((prev) => prev + 1);
    } catch (e) {
      console.error(e);
      setIsError(true);
      setStepsCompleted(0);
    } finally {
      setIsLoading(false);
    }
  }, [signer, network]);

  return { 
    escrowAddress, 
    tokenDecimals, 
    createEscrow, 
    isLoading, 
    stepsCompleted, 
    isError, 
    clearError,
    exchangeOracleFee,
    recordingOracleFee,
    reputationOracleFee
  };
};

export default useCreateEscrow;

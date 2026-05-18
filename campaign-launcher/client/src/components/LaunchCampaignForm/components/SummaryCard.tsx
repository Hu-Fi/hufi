import { type FC } from 'react';

import { type ChainId } from '@human-protocol/sdk';
import { Paper, Stack, styled, Typography } from '@mui/material';

import { useExchangesContext } from '@/providers/ExchangesProvider';
import {
  type CampaignFormValues,
  type MarketMakingFormValues,
  type HoldingFormValues,
  type ThresholdFormValues,
  CampaignTypeNames,
  CampaignType,
} from '@/types';
import { getNetworkName, getTokenInfo } from '@/utils';
import dayjs from '@/utils/dayjs';

type Props = {
  step: number;
  chainId: ChainId | null;
  formValues: CampaignFormValues | null;
  fundAmount?: string;
};

const Row = ({ children }: { children: React.ReactNode }) => (
  <Stack
    direction="row"
    sx={{
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      py: 1,
    }}
  >
    {children}
  </Stack>
);

const RowName = styled(Typography)({
  color: '#a0a0a0',
  fontSize: '14px',
  fontWeight: 500,
});

const RowValue = styled(Typography)({
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 500,
  textAlign: 'right',
});

const getTargetInfo = (
  campaignType: CampaignType,
  formValues: CampaignFormValues
) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return {
        label: 'Daily volume target',
        value: (formValues as MarketMakingFormValues)?.daily_volume_target,
        token: (formValues as MarketMakingFormValues)?.pair.split('/')[1],
      };
    case CampaignType.HOLDING:
      return {
        label: 'Daily balance target',
        value: (formValues as HoldingFormValues)?.daily_balance_target,
        token: (formValues as HoldingFormValues)?.symbol,
      };
    case CampaignType.THRESHOLD:
      return {
        label: 'Minimum balance target',
        value: (formValues as ThresholdFormValues)?.minimum_balance_target,
        token: (formValues as ThresholdFormValues)?.symbol,
      };
  }
};

const getSymbolOrPairInfo = (
  campaignType: CampaignType,
  formValues: CampaignFormValues
) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return {
        label: 'Pair',
        value: (formValues as MarketMakingFormValues)?.pair,
      };
    case CampaignType.HOLDING:
      return {
        label: 'Symbol',
        value: (formValues as HoldingFormValues)?.symbol,
      };
    case CampaignType.THRESHOLD:
      return {
        label: 'Symbol',
      };
  }
};

const SummaryCard: FC<Props> = ({ step, chainId, formValues, fundAmount }) => {
  const { exchangesMap } = useExchangesContext();
  const exchangeName = exchangesMap.get(
    formValues?.exchange || ''
  )?.display_name;

  const { type: campaignType } = formValues || {};

  const isLastStep = step === 5;

  const showFormValues = step > 3;

  const symbolOrPairLabel = campaignType
    ? getSymbolOrPairInfo(campaignType, formValues as CampaignFormValues).label
    : '';

  const symbolOrPair = campaignType
    ? getSymbolOrPairInfo(campaignType, formValues as CampaignFormValues).value
    : '';

  const targetValue = campaignType
    ? getTargetInfo(campaignType, formValues as CampaignFormValues).value
    : '';

  const targetToken = campaignType
    ? getTargetInfo(campaignType, formValues as CampaignFormValues).token
    : '';

  return (
    <Paper
      elevation={0}
      sx={{
        gridArea: 'aside',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '50px',
        height: 'fit-content',
        py: 1,
        px: 2,
        bgcolor: '#251d47',
        borderRadius: '8px',
        border: isLastStep ? 'none' : '1px solid #433679',
      }}
    >
      <Row>
        <RowName>Network</RowName>
        <RowValue>{chainId ? getNetworkName(chainId) : '-'}</RowValue>
      </Row>
      {step > 1 && (
        <Row>
          <RowName>Campaign Type</RowName>
          <RowValue>
            {campaignType ? CampaignTypeNames[campaignType] : '-'}
          </RowValue>
        </Row>
      )}
      {step > 2 && !!formValues && (
        <>
          <Row>
            <RowName>Exchange</RowName>
            <RowValue>{showFormValues ? exchangeName : '-'}</RowValue>
          </Row>
          <Row>
            <RowName>{symbolOrPairLabel}</RowName>
            <RowValue>{showFormValues ? symbolOrPair : '-'}</RowValue>
          </Row>
          <Row>
            <RowName>Fund Token</RowName>
            <RowValue>
              {showFormValues
                ? getTokenInfo(formValues?.fund_token || '')?.label
                : '-'}
            </RowValue>
          </Row>
          <Row>
            <RowName>
              {campaignType
                ? getTargetInfo(campaignType, formValues).label
                : ''}
            </RowName>
            <RowValue>
              {showFormValues ? `${targetValue} ${targetToken}` : '-'}
            </RowValue>
          </Row>
          <Row>
            <RowName>Start Date</RowName>
            <RowValue>
              {showFormValues && formValues?.start_date
                ? dayjs(formValues?.start_date).format('Do MMM YYYY HH:mm')
                : '-'}
            </RowValue>
          </Row>
          <Row>
            <RowName>End Date</RowName>
            <RowValue>
              {showFormValues && formValues?.end_date
                ? dayjs(formValues?.end_date).format('Do MMM YYYY HH:mm')
                : '-'}
            </RowValue>
          </Row>
        </>
      )}
      {step > 3 && (
        <Row>
          <RowName>Fund Amount</RowName>
          <RowValue>
            {fundAmount || '-'}{' '}
            {fundAmount
              ? getTokenInfo(formValues?.fund_token || '')?.label
              : ''}
          </RowValue>
        </Row>
      )}
    </Paper>
  );
};

export default SummaryCard;

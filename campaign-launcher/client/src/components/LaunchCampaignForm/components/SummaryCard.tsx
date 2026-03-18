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
    alignItems="center"
    justifyContent="space-between"
    width="100%"
    py={1}
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
});

const getDailyTargetLabel = (campaignType: CampaignType) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return 'Daily volume target';
    case CampaignType.HOLDING:
      return 'Daily balance target';
    case CampaignType.THRESHOLD:
      return 'Minimum balance target';
    default:
      return campaignType as never;
  }
};

const getTargetValue = (
  campaignType: CampaignType,
  formValues: CampaignFormValues
) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return (formValues as MarketMakingFormValues)?.daily_volume_target;
    case CampaignType.HOLDING:
      return (formValues as HoldingFormValues)?.daily_balance_target;
    case CampaignType.THRESHOLD:
      return (formValues as ThresholdFormValues)?.minimum_balance_target;
  }
};

const getTargetToken = (
  campaignType: CampaignType,
  formValues: CampaignFormValues
) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return (formValues as MarketMakingFormValues)?.pair.split('/')[1];
    case CampaignType.HOLDING:
      return (formValues as HoldingFormValues)?.symbol;
    case CampaignType.THRESHOLD:
      return (formValues as ThresholdFormValues)?.symbol;
  }
};

const getSymbolOrPairLabel = (campaignType: CampaignType) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return 'Pair';
    case CampaignType.HOLDING:
      return 'Symbol';
    case CampaignType.THRESHOLD:
      return 'Symbol';
  }
};

const getSymbolOrPair = (
  campaignType: CampaignType,
  formValues: CampaignFormValues
) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return (formValues as MarketMakingFormValues)?.pair;
    case CampaignType.HOLDING:
      return (formValues as HoldingFormValues)?.symbol;
    case CampaignType.THRESHOLD:
      return (formValues as ThresholdFormValues)?.symbol;
    default:
      return 0;
  }
};

const SummaryCard: FC<Props> = ({ step, chainId, formValues, fundAmount }) => {
  const { exchangesMap } = useExchangesContext();
  const exchangeName = exchangesMap.get(
    formValues?.exchange || ''
  )?.display_name;

  const { type: campaignType } = formValues || {};

  const isLastStep = step === 5;

  const symbolOrPairLabel = campaignType
    ? getSymbolOrPairLabel(campaignType)
    : '';

  const symbolOrPair = campaignType
    ? getSymbolOrPair(campaignType, formValues as CampaignFormValues)
    : '';

  const targetValue = campaignType
    ? getTargetValue(campaignType, formValues as CampaignFormValues)
    : '';

  const targetToken = campaignType
    ? getTargetToken(campaignType, formValues as CampaignFormValues)
    : '';

  return (
    <Paper
      elevation={0}
      sx={{
        gridArea: 'aside',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '90px',
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
            <RowValue>{exchangeName || '-'}</RowValue>
          </Row>
          <Row>
            <RowName>{symbolOrPairLabel}</RowName>
            <RowValue>{symbolOrPair || '-'}</RowValue>
          </Row>
          <Row>
            <RowName>Fund Token</RowName>
            <RowValue>
              {getTokenInfo(formValues?.fund_token || '')?.label || '-'}
            </RowValue>
          </Row>
          <Row>
            <RowName>
              {campaignType ? getDailyTargetLabel(campaignType) : ''}
            </RowName>
            <RowValue>
              {targetValue || '-'} {targetToken}
            </RowValue>
          </Row>
          <Row>
            <RowName>Start Date</RowName>
            <RowValue>
              {formValues?.start_date
                ? dayjs(formValues?.start_date).format('Do MMM YYYY HH:mm')
                : '-'}
            </RowValue>
          </Row>
          <Row>
            <RowName>End Date</RowName>
            <RowValue>
              {formValues?.end_date
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

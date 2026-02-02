import { type FC } from 'react';

import { Paper, Stack, Typography } from '@mui/material';

import { useExchangesContext } from '@/providers/ExchangesProvider';
import {
  type CampaignFormValues,
  type MarketMakingFormValues,
  type HoldingFormValues,
  type ThresholdFormValues,
  CampaignTypeNames,
  CampaignType,
} from '@/types';
import { getTokenInfo } from '@/utils';
import dayjs from '@/utils/dayjs';

type Props = {
  step: number;
  formValues: CampaignFormValues;
  fundAmount?: string;
};

const Row = ({ children }: { children: React.ReactNode }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    width="100%"
    height="24px"
  >
    {children}
  </Stack>
);

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

const getDailyTargetValue = (
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

const getDailyTargetToken = (
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

const ProgressBar: FC<Props> = ({ step, formValues, fundAmount }) => {
  const { exchangesMap } = useExchangesContext();
  const exchangeName = exchangesMap.get(
    formValues?.exchange || ''
  )?.display_name;

  const { type: campaignType } = formValues;

  const symbolOrPair = getSymbolOrPair(
    campaignType,
    formValues as CampaignFormValues
  );

  const dailyTargetValue = getDailyTargetValue(
    campaignType,
    formValues as CampaignFormValues
  );

  const dailyTargetToken = getDailyTargetToken(
    campaignType,
    formValues as CampaignFormValues
  );

  return (
    <Paper
      elevation={24}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: { xs: '100%', md: step > 3 ? '600px' : '400px' },
        minHeight: '150px',
        height: 'fit-content',
        py: 3,
        px: 4,
        gap: 2,
        bgcolor: 'background.default',
        borderRadius: '20px',
        boxShadow: 'none',
      }}
    >
      <Row>
        <Typography variant="subtitle2" component="p" color="text.secondary">
          Campaign Type
        </Typography>
        <Typography variant="subtitle2" component="p" color="text.primary">
          {CampaignTypeNames[campaignType]}
        </Typography>
      </Row>
      {!!fundAmount && (
        <Row>
          <Typography variant="subtitle2" component="p" color="text.secondary">
            Fund Amount
          </Typography>
          <Typography variant="subtitle2" component="p" color="text.primary">
            {fundAmount} {getTokenInfo(formValues?.fund_token || '')?.label}
          </Typography>
        </Row>
      )}
      {step > 2 && !!formValues && (
        <>
          <Row>
            <Typography
              variant="subtitle2"
              component="p"
              color="text.secondary"
            >
              Exchange
            </Typography>
            <Typography variant="subtitle2" component="p" color="text.primary">
              {exchangeName}
            </Typography>
          </Row>
          <Row>
            <Typography
              variant="subtitle2"
              component="p"
              color="text.secondary"
            >
              {campaignType === CampaignType.MARKET_MAKING ? 'Pair' : 'Symbol'}
            </Typography>
            <Typography variant="subtitle2" component="p" color="text.primary">
              {symbolOrPair}
            </Typography>
          </Row>
          <Row>
            <Typography
              variant="subtitle2"
              component="p"
              color="text.secondary"
            >
              {getDailyTargetLabel(campaignType)}
            </Typography>
            <Typography variant="subtitle2" component="p" color="text.primary">
              {dailyTargetValue} {dailyTargetToken}
            </Typography>
          </Row>
          <Row>
            <Typography
              variant="subtitle2"
              component="p"
              color="text.secondary"
            >
              Start Date
            </Typography>
            <Typography variant="subtitle2" component="p" color="text.primary">
              {dayjs(formValues.start_date).format('Do MMM YYYY HH:mm')}
            </Typography>
          </Row>
          <Row>
            <Typography
              variant="subtitle2"
              component="p"
              color="text.secondary"
            >
              End Date
            </Typography>
            <Typography variant="subtitle2" component="p" color="text.primary">
              {dayjs(formValues.end_date).format('Do MMM YYYY HH:mm')}
            </Typography>
          </Row>
        </>
      )}
    </Paper>
  );
};

export default ProgressBar;

import type { FC } from 'react';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router';
import { useConnection } from 'wagmi';

import CampaignSymbol from '@/components/CampaignSymbol';
import FormattedNumber from '@/components/FormattedNumber';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useCampaignTimeline } from '@/hooks/useCampaignTimeline';
import { type Campaign, CampaignType } from '@/types';
import {
  formatTokenAmount,
  getChainIcon,
  getDailyTargetTokenSymbol,
  getTokenInfo,
  mapTypeToLabel,
} from '@/utils';

import CampaignAddress from '../CampaignAddress';

const getTargetLabel = (campaignType: CampaignType) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return 'Target Volume';
    case CampaignType.HOLDING:
      return 'Target Balance';
    case CampaignType.THRESHOLD:
      return 'Target Balance';
    default:
      return 'Target Volume';
  }
};

const getTargetValue = (campaign: Campaign) => {
  switch (campaign.type) {
    case CampaignType.MARKET_MAKING:
      return campaign.details.daily_volume_target;
    case CampaignType.HOLDING:
      return campaign.details.daily_balance_target;
    case CampaignType.THRESHOLD:
      return campaign.details.minimum_balance_target;
    default:
      return 0;
  }
};

const getDisplayTargetValue = (targetValue: number) => {
  const shouldUseDoubleKNotation = targetValue >= 1000000;
  const shouldUseKNotation = targetValue >= 1000 && !shouldUseDoubleKNotation;
  return shouldUseDoubleKNotation
    ? targetValue / 1000000
    : shouldUseKNotation
      ? targetValue / 1000
      : targetValue;
};

type Props = {
  campaign: Campaign;
};

const CampaignCard: FC<Props> = ({ campaign }) => {
  const { fund_amount, fund_token_decimals } = campaign;
  const campaignTimeline = useCampaignTimeline(campaign);
  const { isConnected } = useConnection();
  const queryClient = useQueryClient();

  const joinedCampaignsQueries = queryClient.getQueriesData<{
    results?: Campaign[];
  }>({
    queryKey: [QUERY_KEYS.JOINED_CAMPAIGNS],
  });
  const isAlreadyJoined = joinedCampaignsQueries.some(([, cachedData]) =>
    (cachedData?.results ?? []).some(
      (joinedCampaign) => joinedCampaign.address === campaign.address
    )
  );

  const targetValue = Number(getTargetValue(campaign) || 0);
  const shouldUseDoubleKNotation = targetValue >= 1000000;
  const shouldUseKNotation = targetValue >= 1000 && !shouldUseDoubleKNotation;
  const displayTargetValue = getDisplayTargetValue(targetValue);
  const displayTargetSuffix = shouldUseDoubleKNotation
    ? 'kk'
    : shouldUseKNotation
      ? 'k'
      : '';
  const displayTargetDecimals = displayTargetSuffix ? 1 : 3;

  const targetToken = getDailyTargetTokenSymbol(campaign.type, campaign.symbol);
  const { label: targetTokenSymbol } = getTokenInfo(targetToken);

  return (
    <Paper
      sx={{
        display: 'flex',
        p: 2,
        gap: 1.5,
        flexDirection: 'column',
        background: 'linear-gradient(0deg, #251D47 0%, #251D47 100%), #251D47',
        borderRadius: '8px',
        border: '1px solid #433679',
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          px={2}
          py={0.5}
          borderRadius="6px"
          bgcolor="background.default"
        >
          <Typography
            variant="caption"
            color="text.primary"
            textTransform="uppercase"
            fontWeight={600}
          >
            {mapTypeToLabel(campaign.type)}
          </Typography>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={1}
          sx={{ '& > svg': { fontSize: '20px' } }}
        >
          {getChainIcon(campaign.chain_id)}
          <CampaignAddress
            address={campaign.address}
            chainId={campaign.chain_id}
            size="small"
          />
        </Box>
      </Stack>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        gap={1}
        color="white"
      >
        <CampaignSymbol
          symbol={campaign.symbol}
          campaignType={campaign.type}
          size="small"
        />
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {campaignTimeline.label} {campaignTimeline.value}
        </Typography>
      </Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
      >
        <Box
          display="flex"
          flexDirection="column"
          flex={1}
          px={2}
          py={1.5}
          gap={1.5}
          borderRadius="8px"
          border="1px solid #433679"
          bgcolor="#2d284e"
        >
          <Typography
            variant="caption"
            color="text.primary"
            fontWeight={500}
            textTransform="uppercase"
          >
            {getTargetLabel(campaign.type)}
          </Typography>
          <Typography variant="h6-mobile" color="white" fontWeight={700}>
            <FormattedNumber
              value={displayTargetValue}
              decimals={displayTargetDecimals}
              suffix={displayTargetSuffix + ' ' + targetTokenSymbol}
            />
          </Typography>
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          flex={1}
          px={2}
          py={1.5}
          gap={1.5}
          borderRadius="8px"
          border="1px solid #433679"
          bgcolor="#2d284e"
        >
          <Typography
            variant="caption"
            color="text.primary"
            fontWeight={500}
            textTransform="uppercase"
          >
            Reward pool
          </Typography>
          <Typography variant="h6" color="white" fontWeight={700}>
            <FormattedNumber
              value={formatTokenAmount(fund_amount, fund_token_decimals)}
              prefix="$ "
            />
          </Typography>
        </Box>
      </Stack>
      <Box display="flex" justifyContent="space-between" gap={2}>
        <Button
          component={RouterLink}
          to={`/campaign-details/${campaign.address}`}
          variant="outlined"
          size="large"
          color="primary"
          fullWidth
          sx={{ color: '#ffffff', borderColor: '#433679' }}
        >
          View Details
        </Button>
        {isConnected && !isAlreadyJoined && (
          <Button
            variant="contained"
            size="large"
            color="primary"
            fullWidth
            sx={{
              color: '#ffffff',
              bgcolor: '#fa2a75',
            }}
          >
            Join
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default CampaignCard;

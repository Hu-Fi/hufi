import type { FC } from 'react';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router';
import { useConnection } from 'wagmi';

import CampaignAddress from '@/components/CampaignAddress';
import CampaignSymbol from '@/components/CampaignSymbol';
import CampaignTimeline from '@/components/CampaignTimeline';
import FormattedNumber from '@/components/FormattedNumber';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { type Campaign } from '@/types';
import {
  formatTokenAmount,
  getChainIcon,
  getDailyTargetTokenSymbol,
  getTargetInfo,
  getTokenInfo,
  mapTypeToLabel,
} from '@/utils';

const getDisplayTargetData = (targetValue: number) => {
  const shouldUseDoubleKNotation = targetValue >= 1000000;
  const shouldUseKNotation = targetValue >= 1000 && !shouldUseDoubleKNotation;
  const value = shouldUseDoubleKNotation
    ? targetValue / 1000000
    : shouldUseKNotation
      ? targetValue / 1000
      : targetValue;
  const suffix = shouldUseDoubleKNotation
    ? 'kk'
    : shouldUseKNotation
      ? 'k'
      : '';
  const decimals = suffix ? 1 : 3;

  return { value, suffix, decimals };
};

type Props = {
  campaign: Campaign;
};

const CampaignCard: FC<Props> = ({ campaign }) => {
  const { fund_amount, fund_token_decimals } = campaign;
  const { isConnected } = useConnection();
  const queryClient = useQueryClient();
  const { exchangesMap } = useExchangesContext();

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

  const exchangeName = exchangesMap.get(campaign.exchange_name)?.display_name;

  const targetInfo = getTargetInfo(campaign);
  const targetValue = Number(targetInfo.value || 0);
  const {
    value: displayTargetValue,
    suffix: displayTargetSuffix,
    decimals: displayTargetDecimals,
  } = getDisplayTargetData(targetValue);

  const targetToken = getDailyTargetTokenSymbol(campaign.type, campaign.symbol);
  const { label: targetTokenSymbol } = getTokenInfo(targetToken);

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        gap: 1.5,
        bgcolor: '#251D47',
        borderRadius: '8px',
        border: '1px solid #433679',
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
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="caption"
            color="text.secondary"
            letterSpacing="0.15px"
          >
            {exchangeName}
          </Typography>
          <Box
            width={4}
            height={4}
            borderRadius="50%"
            bgcolor="text.secondary"
            flexShrink={0}
          />
          <CampaignTimeline campaign={campaign} />
        </Box>
      </Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1.5}
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
            {targetInfo.label}
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
      <Box display="flex" justifyContent="space-between" gap={1.5}>
        <Button
          component={RouterLink}
          to={`/campaign-details/${campaign.address}`}
          variant="outlined"
          size="large"
          color="primary"
          fullWidth
          sx={{ color: 'white', borderColor: '#433679' }}
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
              color: 'white',
              bgcolor: 'error.main',
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

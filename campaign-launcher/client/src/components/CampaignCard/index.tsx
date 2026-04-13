import type { FC } from 'react';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';

import CampaignAddress from '@/components/CampaignAddress';
import CampaignSymbol from '@/components/CampaignSymbol';
import CampaignTimeline from '@/components/CampaignTimeline';
import FormattedNumber from '@/components/FormattedNumber';
import JoinCampaignButton from '@/components/JoinCampaignButton';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { type Campaign } from '@/types';
import {
  formatTokenAmount,
  getChainIcon,
  getCompactNumberParts,
  getDailyTargetTokenSymbol,
  getTargetInfo,
  getTokenInfo,
  mapTypeToLabel,
} from '@/utils';

type Props = {
  campaign: Campaign;
};

const CampaignCard: FC<Props> = ({ campaign }) => {
  const { fund_amount, fund_token_decimals } = campaign;
  const { exchangesMap } = useExchangesContext();

  const exchangeName =
    exchangesMap.get(campaign.exchange_name)?.display_name ||
    campaign.exchange_name;

  const targetInfo = getTargetInfo(campaign);
  const targetValue = Number(targetInfo.value || 0);
  const {
    value: displayTargetValue,
    suffix: displayTargetSuffix,
    decimals: displayTargetDecimals,
  } = getCompactNumberParts(targetValue);

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
            color="white"
            fontSize={16}
            fontWeight={600}
            lineHeight="150%"
            letterSpacing="0.15px"
            textTransform="capitalize"
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
            color="#a29dca"
            fontSize={10}
            lineHeight="135%"
            fontWeight={700}
            letterSpacing="1.2px"
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
            color="#a29dca"
            fontSize={10}
            lineHeight="135%"
            fontWeight={700}
            letterSpacing="1.2px"
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
      <Box
        display="flex"
        justifyContent="space-between"
        gap={1.5}
        sx={{ '& > .MuiButton-root': { flex: 1 } }}
      >
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
        <JoinCampaignButton campaign={campaign} />
      </Box>
    </Paper>
  );
};

export default CampaignCard;

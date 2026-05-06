import type { FC } from 'react';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';

import CampaignAddress from '@/components/CampaignAddress';
import CampaignSymbol from '@/components/CampaignSymbol';
import CampaignTimeline from '@/components/CampaignTimeline';
import CustomTooltip from '@/components/CustomTooltip';
import FormattedNumber from '@/components/FormattedNumber';
import JoinCampaignButton from '@/components/JoinCampaignButton';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { type JoinedCampaign, type Campaign } from '@/types';
import {
  formatTokenAmount,
  getChainIcon,
  getCompactNumberParts,
  getDailyTargetTokenSymbol,
  getNetworkName,
  getTargetInfo,
  getTokenInfo,
  mapTypeToLabel,
} from '@/utils';

type Props =
  | {
      campaign: JoinedCampaign;
      isJoinedCampaign: true;
    }
  | {
      campaign: Campaign;
      isJoinedCampaign: false;
    };

const CampaignCard: FC<Props> = ({ campaign, isJoinedCampaign }) => {
  const { fund_amount } = campaign;
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

  const _rewardValue = isJoinedCampaign
    ? fund_amount
    : formatTokenAmount(fund_amount.toString(), campaign.fund_token_decimals);

  const {
    value: rewardValue,
    suffix: rewardSuffix,
    decimals: rewardDecimals,
  } = getCompactNumberParts(Number(_rewardValue));

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
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            py: 0.5,
            borderRadius: '6px',
            bgcolor: 'background.default',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.primary',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {mapTypeToLabel(campaign.type)}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <CustomTooltip
            arrow
            title={getNetworkName(campaign.chain_id) || 'Unknown Network'}
            placement="top"
          >
            <Box
              sx={{
                display: 'flex',
                '& > svg': { fontSize: '20px' },
              }}
            >
              {getChainIcon(campaign.chain_id)}
            </Box>
          </CustomTooltip>
          <CampaignAddress
            address={campaign.address}
            chainId={campaign.chain_id}
            size="small"
          />
        </Box>
      </Stack>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 1,
          color: 'white',
        }}
      >
        <CampaignSymbol
          symbol={campaign.symbol}
          campaignType={campaign.type}
          size="small"
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography
            sx={{
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              lineHeight: '150%',
              letterSpacing: '0.15px',
              textTransform: 'capitalize',
            }}
          >
            {exchangeName}
          </Typography>
          <Box
            sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              bgcolor: 'text.secondary',
              flexShrink: 0,
            }}
          />
          <CampaignTimeline campaign={campaign} />
        </Box>
      </Box>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            p: { xs: 1.5, md: 2 },
            gap: 1.5,
            borderRadius: '8px',
            border: '1px solid #433679',
            bgcolor: '#2d284e',
          }}
        >
          <Typography
            sx={{
              color: '#a29dca',
              fontSize: 10,
              lineHeight: '135%',
              fontWeight: 700,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
            }}
          >
            {targetInfo.label}
          </Typography>
          <Typography
            variant="h6-mobile"
            sx={{
              color: 'white',
              fontWeight: 700,
            }}
          >
            <FormattedNumber
              value={displayTargetValue}
              decimals={displayTargetDecimals}
              suffix={`${displayTargetSuffix} `}
            />
            <Typography
              component="span"
              sx={{
                color: 'text.primary',
                fontSize: { xs: 12, md: 16 },
                fontWeight: 600,
                lineHeight: '150%',
              }}
            >
              {targetTokenSymbol}
            </Typography>
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            p: { xs: 1.5, md: 2 },
            gap: 1.5,
            borderRadius: '8px',
            border: '1px solid #433679',
            bgcolor: '#2d284e',
          }}
        >
          <Typography
            sx={{
              color: '#a29dca',
              fontSize: 10,
              lineHeight: '135%',
              fontWeight: 700,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
            }}
          >
            Reward pool
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 700,
            }}
          >
            <FormattedNumber
              value={rewardValue}
              decimals={rewardDecimals}
              suffix={`${rewardSuffix} `}
            />
            <Typography
              component="span"
              sx={{
                color: 'text.primary',
                fontSize: { xs: 12, md: 16 },
                fontWeight: 600,
                lineHeight: '150%',
              }}
            >
              {isJoinedCampaign
                ? campaign.fund_token.toUpperCase()
                : campaign.fund_token_symbol.toUpperCase()}
            </Typography>
          </Typography>
        </Box>
      </Stack>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1.5,
          '& > .MuiButton-root': { flex: 1 },
        }}
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
        <JoinCampaignButton campaign={campaign as Campaign} />
      </Box>
    </Paper>
  );
};

export default CampaignCard;

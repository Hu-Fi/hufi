import { type FC } from 'react';

import {
  Box,
  Divider as MuiDivider,
  Skeleton,
  Stack,
  styled,
  Typography,
} from '@mui/material';

import CampaignAddress from '@/components/CampaignAddress';
import CampaignStatusLabel from '@/components/CampaignStatusLabel';
import CustomTooltip from '@/components/CustomTooltip';
import JoinCampaignButton from '@/components/JoinCampaignButton';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import type { CampaignDetails } from '@/types';
import { getChainIcon, getNetworkName } from '@/utils';
import dayjs from '@/utils/dayjs';

const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('Do MMM YYYY');
};

const formatTime = (dateString: string): string => {
  const date = dayjs(dateString);
  return date.format('HH:mm [GMT]Z');
};

const formatJoinTime = (dateString: string): string => {
  return dayjs(dateString).format('HH:mm');
};

const DividerStyled = styled(MuiDivider)({
  borderColor: 'rgba(255, 255, 255, 0.3)',
  height: 16,
  alignSelf: 'center',
});

type Props = {
  campaign: CampaignDetails | null | undefined;
  isCampaignLoading: boolean;
  isOngoingCampaign: boolean;
  isJoined: boolean;
  joinedAt: string | undefined;
  isJoinStatusLoading: boolean;
};

const CampaignInfo: FC<Props> = ({
  campaign,
  isCampaignLoading,
  isOngoingCampaign,
  isJoined,
  joinedAt,
  isJoinStatusLoading,
}) => {
  const isMobile = useIsMobile();
  const { activeAddress } = useActiveAccount();

  const isHosted = campaign?.launcher === activeAddress;

  if (isCampaignLoading) {
    if (isMobile) {
      return (
        <Stack
          sx={{
            mx: -2,
            px: 2,
            pb: 4,
            gap: 2.5,
            borderBottom: '1px solid',
            borderColor: 'border.strong',
          }}
        >
          <Skeleton variant="text" width="100%" height={24} />
          <Skeleton variant="text" width="100%" height={49} />
          {isJoined && (
            <Skeleton variant="rectangular" width="100%" height={36} />
          )}
        </Stack>
      );
    }

    return (
      <Stack sx={{ gap: 3.5 }}>
        <Skeleton variant="text" width="100%" height={42} />
        <Skeleton variant="text" width="100%" height={32} />
        {isJoined && (
          <Skeleton variant="rectangular" width="100%" height={36} />
        )}
      </Stack>
    );
  }

  if (!campaign) return null;

  const oracleFee =
    campaign.exchange_oracle_fee_percent +
    campaign.recording_oracle_fee_percent +
    campaign.reputation_oracle_fee_percent;

  return (
    <Stack
      sx={{
        mx: { xs: -2, md: 0 },
        px: { xs: 2, md: 0 },
        pb: { xs: 4, md: 0 },
        gap: { xs: 2.5, md: 3.5 },
        borderBottom: { xs: '1px solid', md: 'none' },
        borderColor: { xs: 'border.strong', md: 'unset' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          height: { xs: 'auto', md: '42px' },
        }}
      >
        <Typography variant="h5" sx={{ color: 'neutral.100' }}>
          Campaign Details
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <CampaignStatusLabel
            campaignStatus={campaign.status}
            startDate={campaign.start_date}
            endDate={campaign.end_date}
          />
          {!isMobile && <JoinCampaignButton campaign={campaign} />}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: 1.5,
          rowGap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 24, md: 32 },
              height: { xs: 24, md: 32 },
              borderRadius: '100%',
              bgcolor: 'background.paper',
              '& > svg': { fontSize: { xs: '12px', md: '16px' } },
            }}
          >
            {getChainIcon(campaign.chain_id)}
          </Box>
          <Typography
            variant={isMobile ? 'body1' : 'h5'}
            sx={{
              color: isMobile ? 'text.primary' : 'neutral.100',
              textTransform: 'uppercase',
            }}
          >
            {getNetworkName(campaign.chain_id)?.slice(0, 3)}
          </Typography>
        </Box>
        <DividerStyled orientation="vertical" flexItem />
        <CampaignAddress
          address={campaign.address}
          chainId={campaign.chain_id}
          size={isMobile ? 'medium' : 'large'}
          withCopy
        />
        <DividerStyled orientation="vertical" flexItem />
        {(isJoined || isHosted) && (
          <>
            <Typography
              variant={isMobile ? 'body1' : 'h5'}
              sx={{
                color: 'accent.main',
                textTransform: 'uppercase',
              }}
            >
              {isJoined ? 'Joined' : 'Hosted'}
            </Typography>
            <DividerStyled orientation="vertical" flexItem />
          </>
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <CustomTooltip
            arrow
            placement="top"
            title={formatTime(campaign.start_date)}
          >
            <Typography
              variant={isMobile ? 'body1' : 'h5'}
              sx={{
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textDecorationThickness: '12%',
              }}
            >
              {formatDate(campaign.start_date)}
            </Typography>
          </CustomTooltip>
          <Typography
            variant={isMobile ? 'body1' : 'h5'}
            component="span"
            sx={{ color: 'accent.main' }}
          >
            &gt;
          </Typography>
          <CustomTooltip
            arrow
            placement="top"
            title={formatTime(campaign.end_date)}
          >
            <Typography
              variant={isMobile ? 'body1' : 'h5'}
              sx={{
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textDecorationThickness: '12%',
              }}
            >
              {formatDate(campaign.end_date)}
            </Typography>
          </CustomTooltip>
        </Box>
        <DividerStyled orientation="vertical" flexItem />
        <Typography variant={isMobile ? 'body1' : 'h5'}>
          {oracleFee}% Oracle fees
        </Typography>
      </Box>
      {!isJoinStatusLoading && joinedAt && isOngoingCampaign && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            bgcolor: 'rgba(212, 207, 255, 0.15)',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'border.main',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.muted',
              textTransform: 'uppercase',
            }}
          >
            Joined at
          </Typography>
          <Typography variant="body1">
            {' '}
            {formatDate(joinedAt)}
            {', '}
            {formatJoinTime(joinedAt)}
          </Typography>
        </Box>
      )}
    </Stack>
  );
};

export default CampaignInfo;

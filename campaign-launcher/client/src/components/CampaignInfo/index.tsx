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
import JoinCampaignButton from '@/components/JoinCampaignButton';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import type { CampaignDetails } from '@/types';
import { getChainIcon, getNetworkName } from '@/utils';
import dayjs from '@/utils/dayjs';

const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('Do MMM YYYY');
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
  isJoined: boolean;
  joinedAt: string | undefined;
  isJoinStatusLoading: boolean;
};

const CampaignInfo: FC<Props> = ({
  campaign,
  isCampaignLoading,
  isJoined,
  joinedAt,
  isJoinStatusLoading,
}) => {
  const isMobile = useIsMobile();
  const { activeAddress } = useActiveAccount();

  const isHosted =
    campaign?.launcher?.toLowerCase() === activeAddress?.toLowerCase();

  if (isCampaignLoading) {
    if (isMobile) {
      return (
        <Stack mx={-2} px={2} pb={4} gap={2} borderBottom="1px solid #473C74">
          <Skeleton variant="text" width="100%" height={32} />
          <Skeleton variant="text" width="100%" height={48} />
          {isJoined && (
            <Skeleton variant="rectangular" width="100%" height={39} />
          )}
        </Stack>
      );
    }

    return (
      <Stack gap={3.5}>
        <Skeleton variant="text" width="100%" height={42} />
        <Skeleton variant="text" width="100%" height={32} />
        {isJoined && (
          <Skeleton variant="rectangular" width="100%" height={39} />
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
      mx={{ xs: -2, md: 0 }}
      px={{ xs: 2, md: 0 }}
      pb={{ xs: 4, md: 0 }}
      gap={{ xs: 2, md: 3.5 }}
      borderBottom={{ xs: '1px solid #473C74', md: 'none' }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        height={{ xs: 'auto', md: '42px' }}
      >
        <Typography
          variant="h6"
          color="white"
          fontWeight={{ xs: 500, md: 600 }}
        >
          Campaign Details
        </Typography>
        <Box display="flex" alignItems="center" gap={3}>
          <CampaignStatusLabel
            campaignStatus={campaign.status}
            startDate={campaign.start_date}
            endDate={campaign.end_date}
          />
          {!isMobile && <JoinCampaignButton campaign={campaign} />}
        </Box>
      </Box>
      <Box
        display="flex"
        flexWrap="wrap"
        alignItems="center"
        columnGap={1.5}
        rowGap={1}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            width={{ xs: 24, md: 32 }}
            height={{ xs: 24, md: 32 }}
            borderRadius="100%"
            bgcolor="#3a2e6f"
            sx={{ '& > svg': { fontSize: { xs: '12px', md: '16px' } } }}
          >
            {getChainIcon(campaign.chain_id)}
          </Box>
          <Typography
            color={isMobile ? 'text.primary' : 'white'}
            fontSize={{ xs: 14, md: 20 }}
            fontWeight={500}
            lineHeight="100%"
            letterSpacing={0}
            textTransform="uppercase"
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
              color="error.main"
              fontSize={{ xs: 14, md: 20 }}
              fontWeight={500}
              lineHeight="100%"
              letterSpacing={0}
              textTransform="uppercase"
            >
              {isJoined ? 'Joined' : 'Hosted'}
            </Typography>
            <DividerStyled orientation="vertical" flexItem />
          </>
        )}
        <Typography
          display="flex"
          alignItems="center"
          gap={1}
          fontSize={{ xs: 14, md: 20 }}
          fontWeight={500}
          lineHeight="100%"
          letterSpacing={0}
        >
          {formatDate(campaign.start_date)}
          {' > '}
          {formatDate(campaign.end_date)}
        </Typography>
        <DividerStyled orientation="vertical" flexItem />
        <Typography
          fontSize={{ xs: 14, md: 20 }}
          fontWeight={500}
          lineHeight="100%"
          letterSpacing={0}
        >
          {oracleFee}% Oracle fees
        </Typography>
      </Box>
      {!isJoinStatusLoading && joinedAt && (
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          justifyContent="space-between"
          px={2}
          py={1}
          bgcolor="rgba(212, 207, 255, 0.15)"
          borderRadius="8px"
          border="1px solid rgba(255, 255, 255, 0.07)"
        >
          <Typography
            color="#a496c2"
            fontSize={12}
            fontWeight={600}
            lineHeight="150%"
            letterSpacing="1.5px"
            textTransform="uppercase"
          >
            Joined at
          </Typography>
          <Typography fontSize={14} fontWeight={500} lineHeight="150%">
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

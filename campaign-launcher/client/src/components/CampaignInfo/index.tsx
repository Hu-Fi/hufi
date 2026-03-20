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
import CampaignSymbol from '@/components/CampaignSymbol';
import JoinCampaign from '@/components/JoinCampaign';
import { useIsMobile } from '@/hooks/useBreakpoints';
import type { CampaignDetails, CampaignJoinStatus } from '@/types';
import { getChainIcon, getNetworkName, mapTypeToLabel } from '@/utils';
import dayjs from '@/utils/dayjs';

const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('Do MMM YYYY');
};

const DividerStyled = styled(MuiDivider)({
  borderColor: 'rgba(255, 255, 255, 0.3)',
  height: 16,
  alignSelf: 'center',
});

type Props = {
  campaign: CampaignDetails | null | undefined;
  isCampaignLoading: boolean;
  joinStatus?: CampaignJoinStatus;
  joinedAt?: string;
  isJoinStatusLoading: boolean;
};

const CampaignInfo: FC<Props> = ({
  campaign,
  isCampaignLoading,
  joinStatus,
  joinedAt,
  isJoinStatusLoading,
}) => {
  const isMobile = useIsMobile();

  if (isCampaignLoading) {
    if (isMobile) {
      return (
        <Stack
          mb={4}
          mx={-2}
          px={2}
          pb={4}
          gap={1.5}
          borderBottom="1px solid #473C74"
        >
          <Skeleton variant="text" width="100%" height={30} />
          <Skeleton variant="text" width="100%" height={48} />
        </Stack>
      );
    }

    return (
      <Stack mb={3.5} gap={3.5}>
        <Skeleton variant="text" width="100%" height={42} />
        <Skeleton variant="text" width="100%" height={32} />
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
      mb={{ xs: 4, md: 3.5 }}
      mx={{ xs: -2, md: 0 }}
      px={{ xs: 2, md: 0 }}
      pb={{ xs: 4, md: 0 }}
      gap={{ xs: 1.5, md: 3.5 }}
      borderBottom={{ xs: '1px solid #473C74', md: 'none' }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        gap={2}
        height={{ xs: 'auto', md: '42px' }}
      >
        <CampaignSymbol
          symbol={campaign.symbol}
          campaignType={campaign.type}
          size="small"
        />
        <Box display="flex" alignItems="center" gap={3}>
          <CampaignStatusLabel
            campaignStatus={campaign.status}
            startDate={campaign.start_date}
            endDate={campaign.end_date}
          />
          {!isMobile && (
            <JoinCampaign
              campaign={campaign}
              joinStatus={joinStatus}
              joinedAt={joinedAt}
              isJoinStatusLoading={isJoinStatusLoading}
            />
          )}
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
        <Typography
          fontSize={{ xs: 14, md: 20 }}
          fontWeight={500}
          lineHeight="100%"
          letterSpacing={0}
        >
          {mapTypeToLabel(campaign.type)}
        </Typography>
        <DividerStyled orientation="vertical" flexItem />
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
    </Stack>
  );
};

export default CampaignInfo;

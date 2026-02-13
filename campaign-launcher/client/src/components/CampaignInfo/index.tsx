import { useState, type FC } from 'react';

import { Box, Button, Skeleton, Stack, Typography } from '@mui/material';

import CampaignAddress from '@/components/CampaignAddress';
import CampaignStatusLabel from '@/components/CampaignStatusLabel';
import CampaignTypeLabel from '@/components/CampaignTypeLabel';
import CustomTooltip from '@/components/CustomTooltip';
import JoinCampaign from '@/components/JoinCampaign';
import ChartModal from '@/components/modals/ChartModal';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { CalendarIcon } from '@/icons';
import type { CampaignDetails, CampaignJoinStatus } from '@/types';
import { getChainIcon, getNetworkName } from '@/utils';
import dayjs from '@/utils/dayjs';

const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('D MMM YYYY');
};

const formatTime = (dateString: string): string => {
  const date = dayjs(dateString);
  return date.format('HH:mm [GMT]Z');
};

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isMobile = useIsMobile();

  if (isCampaignLoading) {
    if (!isMobile) return null;

    return (
      <Stack gap={3} width="100%">
        <Skeleton variant="text" width="100%" height={36} />
        <Skeleton variant="text" width="100%" height={24} />
        <Skeleton variant="text" width="100%" height={24} />
      </Stack>
    );
  }

  if (!campaign) return null;

  return (
    <Box
      display="flex"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      flexDirection={{ xs: 'column', md: 'row' }}
      height={{ xs: 'auto', md: '40px' }}
      gap={{ xs: 3, md: 4 }}
      width="100%"
    >
      <Box
        display="flex"
        alignItems="center"
        width={{ xs: '100%', md: 'auto' }}
        gap={1}
        order={1}
      >
        <CampaignTypeLabel campaignType={campaign.type} />
        <CampaignStatusLabel
          campaignStatus={campaign.status}
          startDate={campaign.start_date}
          endDate={campaign.end_date}
        />
        {isMobile && (
          <JoinCampaign
            campaign={campaign}
            joinStatus={joinStatus}
            joinedAt={joinedAt}
            isJoinStatusLoading={isJoinStatusLoading}
          />
        )}
      </Box>
      <Box order={{ xs: 3, md: 2 }}>
        <CampaignAddress
          address={campaign.address}
          chainId={campaign.chain_id}
          withCopy
        />
      </Box>
      <Box display="flex" alignItems="center" gap={3} order={{ xs: 2, md: 3 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarIcon />
          <CustomTooltip
            arrow
            placement="top"
            title={formatTime(campaign.start_date)}
          >
            <Typography variant="subtitle2" borderBottom="1px dashed">
              {formatDate(campaign.start_date)}
            </Typography>
          </CustomTooltip>
          <Typography component="span" variant="subtitle2">
            -
          </Typography>
          <CustomTooltip
            arrow
            placement="top"
            title={formatTime(campaign.end_date)}
          >
            <Typography variant="subtitle2" borderBottom="1px dashed">
              {formatDate(campaign.end_date)}
            </Typography>
          </CustomTooltip>
        </Box>
        <CustomTooltip
          arrow
          title={getNetworkName(campaign.chain_id) || 'Unknown Network'}
          placement="top"
        >
          <Box display="flex">{getChainIcon(campaign.chain_id)}</Box>
        </CustomTooltip>
      </Box>
      {!isMobile && (
        <Box ml={{ xs: 0, md: 'auto' }} order={4}>
          <Button
            variant="outlined"
            size="medium"
            onClick={() => setIsModalOpen(true)}
          >
            Paid Amount Chart
          </Button>
          {isModalOpen && (
            <ChartModal
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              campaign={campaign}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default CampaignInfo;

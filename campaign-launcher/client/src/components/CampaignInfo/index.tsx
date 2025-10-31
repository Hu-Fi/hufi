import { useState, type FC } from 'react';

import { Box, Button, Typography } from '@mui/material';

import CampaignAddress from '@/components/CampaignAddress';
import CampaignStatusLabel from '@/components/CampaignStatusLabel';
import CampaignTypeLabel from '@/components/CampaignTypeLabel';
import CustomTooltip from '@/components/CustomTooltip';
import ChartModal from '@/components/modals/ChartModal';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { CalendarIcon } from '@/icons';
import type { CampaignDetails } from '@/types';
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
  campaign: CampaignDetails;
  isJoined: boolean;
  isJoinedLoading: boolean;
};

const CampaignInfo: FC<Props> = ({ campaign }) => {
  const [openChartModal, setOpenChartModal] = useState(false);

  const isMobile = useIsMobile();

  const isCompleted = campaign.status === 'completed';
  return (
    <Box
      display="flex"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      flexDirection={{ xs: 'column', md: 'row' }}
      height={{ xs: 'auto', md: '40px' }}
      gap={{ xs: 3, md: 4 }}
      width={{ xs: '100%', md: 'auto' }}
    >
      <Box
        display="flex"
        alignItems="center"
        width={{ xs: '100%', md: 'auto' }}
        gap={1}
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
            isAlreadyJoined={isJoined}
            isJoinedLoading={isJoinedLoading}
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
          {campaign?.start_date && campaign?.end_date && (
            <>
              <CalendarIcon />
              <CustomTooltip
                arrow
                placement="top"
                title={formatTime(campaign.start_date)}
              >
                <Typography
                  variant="subtitle2"
                  borderBottom="1px dashed"
                  sx={{ cursor: 'pointer' }}
                >
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
                <Typography
                  variant="subtitle2"
                  borderBottom="1px dashed"
                  sx={{ cursor: 'pointer' }}
                >
                  {formatDate(campaign.end_date)}
                </Typography>
              </CustomTooltip>
            </>
          )}
        </Box>
      </Box>
      <Button
        variant="outlined"
        size="medium"
        onClick={() => setOpenChartModal(true)}
      >
        Paid Amount Chart
      </Button>
      <ChartModal
        open={openChartModal}
        onClose={() => setOpenChartModal(false)}
        campaign={campaign}
      />
    </Box>
  );
};

export default CampaignInfo;

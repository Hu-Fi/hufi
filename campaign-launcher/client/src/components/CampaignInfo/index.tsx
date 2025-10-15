import { FC, useState } from 'react';

import { Box, Button, Typography } from '@mui/material';

import { CalendarIcon } from '../../icons';
import { CampaignDetails } from '../../types';
import { getChainIcon, getNetworkName, mapStatusToColor } from '../../utils';
import dayjs from '../../utils/dayjs';
import CampaignAddress from '../CampaignAddress';
import CampaignTypeLabel from '../CampaignTypeLabel';
import CustomTooltip from '../CustomTooltip';
import ChartModal from '../modals/ChartModal';

const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('D MMM YYYY');
};

const formatTime = (dateString: string): string => {
  const date = dayjs(dateString);
  return date.format('HH:mm [GMT]Z');
};

type Props = {
  campaign: CampaignDetails;
};

const CampaignInfo: FC<Props> = ({ campaign }) => {
  const [openChartModal, setOpenChartModal] = useState(false);

  const isCompleted = campaign.status === 'completed';
  return (
    <Box
      display="flex"
      alignItems="center"
      height={{ xs: 'auto', md: '40px' }}
      gap={4}
      flexWrap={{ xs: 'wrap', md: 'nowrap' }}
    >
      <CampaignTypeLabel campaignType={campaign.type} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        ml={-2}
        px={2}
        py="6px"
        bgcolor={mapStatusToColor(
          campaign.status,
          campaign.start_date,
          campaign.end_date
        )}
        borderRadius="4px"
        textTransform="capitalize"
      >
        <Typography
          variant="subtitle2"
          color={isCompleted ? 'secondary.contrast' : 'primary.contrast'}
        >
          {campaign.status.split('_').join(' ')}
        </Typography>
      </Box>
      <CampaignAddress
        address={campaign.address}
        chainId={campaign.chain_id}
        withCopy
      />
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
      <CustomTooltip
        arrow
        title={getNetworkName(campaign.chain_id) || 'Unknown Network'}
        placement="top"
      >
        <Box display="flex" sx={{ cursor: 'pointer' }}>
          {getChainIcon(campaign.chain_id)}
        </Box>
      </CustomTooltip>
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

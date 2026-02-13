import { type FC, useEffect } from 'react';

import { CircularProgress, Typography } from '@mui/material';

import DailyAmountPaidChart from '@/components/DailyAmountPaidChart';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useCampaignDailyPaidAmounts } from '@/hooks/useCampaigns';
import { useNotification } from '@/hooks/useNotification';
import type { CampaignDetails } from '@/types';

import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
  campaign: CampaignDetails;
};

const ChartModal: FC<Props> = ({ open, onClose, campaign }) => {
  const isMobile = useIsMobile();
  const { showError } = useNotification();
  const { data, isLoading, isError } = useCampaignDailyPaidAmounts(
    campaign.address
  );

  useEffect(() => {
    if (isError) {
      showError('Failed to load daily paid amounts.');
    }
  }, [isError, showError]);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 500,
      }}
    >
      <Typography
        variant="h4"
        color="text.primary"
        mb={isLoading ? 0 : { xs: 3, md: 7 }}
      >
        {isMobile ? 'Amount Paid' : 'Paid Amount Chart'}
      </Typography>
      {isLoading ? (
        <CircularProgress size={100} sx={{ my: 'auto' }} />
      ) : (
        <DailyAmountPaidChart
          data={data?.daily_paid_amounts ?? []}
          endDate={campaign.end_date}
          tokenSymbol={campaign.fund_token_symbol}
          tokenDecimals={campaign.fund_token_decimals}
        />
      )}
    </BaseModal>
  );
};

export default ChartModal;

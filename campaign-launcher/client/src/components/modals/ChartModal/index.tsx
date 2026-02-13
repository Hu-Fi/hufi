import { type FC } from 'react';

import { CircularProgress, Typography } from '@mui/material';

import DailyAmountPaidChart from '@/components/DailyAmountPaidChart';
import ModalError from '@/components/ModalState/Error';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useCampaignDailyPaidAmounts } from '@/hooks/useCampaigns';
import type { CampaignDetails } from '@/types';

import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
  campaign: CampaignDetails;
};

const ChartModal: FC<Props> = ({ open, onClose, campaign }) => {
  const isMobile = useIsMobile();
  const { data, isLoading, isError, isSuccess } = useCampaignDailyPaidAmounts(
    campaign.address
  );

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
      {isLoading && <CircularProgress size={100} sx={{ my: 'auto' }} />}
      {isError && <ModalError message="Failed to load daily paid amounts." />}
      {isSuccess && (
        <DailyAmountPaidChart
          data={data?.results ?? []}
          endDate={campaign.end_date}
          tokenSymbol={campaign.fund_token_symbol}
          tokenDecimals={campaign.fund_token_decimals}
        />
      )}
    </BaseModal>
  );
};

export default ChartModal;

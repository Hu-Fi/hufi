import { FC } from "react";

import { Typography } from "@mui/material";

import { CampaignDetails } from "../../../types";
import DailyAmountPaidChart from "../../DailyAmountPaidChart";
import BaseModal from "../BaseModal"

type Props = {
  open: boolean;
  onClose: () => void;
  campaign: CampaignDetails;
};

const ChartModal: FC<Props> = ({ open, onClose, campaign }) => {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 500,
      }}
    >
      <Typography variant="h4" color="text.primary" mb={{ xs: 3, md: 7 }}>
        Paid Amount Chart
      </Typography>
      <DailyAmountPaidChart 
        data={campaign.daily_paid_amounts} 
        endDate={campaign.end_date} 
        tokenSymbol={campaign.fund_token_symbol} 
        tokenDecimals={campaign.fund_token_decimals} 
      />
    </BaseModal>
  )
}

export default ChartModal;

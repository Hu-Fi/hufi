import { FC } from "react";

import { Typography } from "@mui/material";

import DailyAmountPaidChart from "../../DailyAmountPaidChart";
import BaseModal from "../BaseModal"

type Props = {
  open: boolean;
  onClose: () => void;
  data: {
    date: string;
    amount: string;
  }[];
  endDate: string;
  tokenSymbol: string;
  tokenDecimals: number;
};

const ChartModal: FC<Props> = ({ open, onClose, data, endDate, tokenSymbol, tokenDecimals }) => {
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
        Daily amount paid chart
      </Typography>
      <DailyAmountPaidChart data={data} endDate={endDate} tokenSymbol={tokenSymbol} tokenDecimals={tokenDecimals} />
    </BaseModal>
  )
}

export default ChartModal;

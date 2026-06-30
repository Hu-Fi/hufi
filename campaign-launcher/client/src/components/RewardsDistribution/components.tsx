import { type FC } from 'react';

import { Box, Typography } from '@mui/material';

import { getCompactNumberParts, getOrdinalSuffix } from '@/utils';

import FormattedNumber from '../FormattedNumber';

type RewardPlaceProps = {
  place: number;
};

export const RewardPlace: FC<RewardPlaceProps> = ({ place }) => {
  return (
    <Typography
      variant="body2"
      sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: 80 }}
    >
      <Box
        component="span"
        sx={{
          p: 0.25,
          borderRadius: '50%',
          bgcolor: 'neutral.200',
        }}
      />
      {`${place}${getOrdinalSuffix(place)} place`}
    </Typography>
  );
};

type RewardAmountProps = {
  percentage: number;
  fundToken: string;
  fundAmount: number;
};

export const RewardAmount: FC<RewardAmountProps> = ({
  percentage,
  fundToken,
  fundAmount,
}) => {
  const { value, suffix, decimals } = getCompactNumberParts(
    (percentage * fundAmount) / 100
  );
  return (
    <Typography
      variant="body2"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'background.paper',
        py: 0.5,
        px: { xs: 1, md: 1.5 },
        minWidth: { xs: '110px', md: '120px' },
        borderRadius: '99px',
        textTransform: 'uppercase',
      }}
    >
      <FormattedNumber
        value={value}
        decimals={decimals}
        suffix={`${suffix} ${fundToken}`}
      />
    </Typography>
  );
};

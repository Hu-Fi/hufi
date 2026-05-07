import type { FC } from 'react';

import { Typography } from '@mui/material';

import CustomTooltip from '@/components/CustomTooltip';
import FormattedNumber from '@/components/FormattedNumber';
import { getCompactNumberParts } from '@/utils';

type Props = {
  value: number | string | undefined | null;
  tooltipSize?: 'small' | 'large';
};

const CompactNumberWithTooltip: FC<Props> = ({
  value,
  tooltipSize = 'small',
}) => {
  const numericValue = Number(value || 0);
  const {
    value: _value,
    decimals,
    suffix,
  } = getCompactNumberParts(numericValue);

  if (numericValue < 1000) {
    return (
      <FormattedNumber
        value={_value}
        decimals={decimals}
        suffix={`${suffix} `}
      />
    );
  }

  return (
    <CustomTooltip
      title={value}
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: {
            fontSize: tooltipSize === 'small' ? '12px' : '16px',
          },
        },
      }}
    >
      <Typography
        component="span"
        sx={{
          color: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          lineHeight: 'inherit',
          letterSpacing: 'inherit',
          textDecoration: 'underline',
          textDecorationThickness: '12%',
          textDecorationStyle: 'dotted',
        }}
      >
        <FormattedNumber
          value={_value}
          decimals={decimals}
          suffix={`${suffix}`}
        />
      </Typography>
    </CustomTooltip>
  );
};

export default CompactNumberWithTooltip;

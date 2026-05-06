import type { FC } from 'react';

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
  const {
    value: _value,
    decimals,
    suffix,
  } = getCompactNumberParts(Number(value || 0));

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
      <FormattedNumber
        value={_value}
        decimals={decimals}
        suffix={`${suffix} `}
      />
    </CustomTooltip>
  );
};

export default CompactNumberWithTooltip;

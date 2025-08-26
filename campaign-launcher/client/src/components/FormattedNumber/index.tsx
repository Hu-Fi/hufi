import { FC } from 'react';

import { NumericFormat } from 'react-number-format';

type Props = {
  value: number | string | undefined | null;
  decimals?: number;
  prefix?: string;
  suffix?: string;
};

const FormattedNumber: FC<Props> = ({
  value,
  decimals = 3,
  prefix = '',
  suffix = '',
}) => {
  const _value = Number(value || 0);

  return (
    <NumericFormat
      displayType="text"
      value={_value}
      thousandsGroupStyle="thousand"
      thousandSeparator=","
      decimalScale={decimals}
      prefix={prefix}
      suffix={suffix}
    />
  );
};

export default FormattedNumber;

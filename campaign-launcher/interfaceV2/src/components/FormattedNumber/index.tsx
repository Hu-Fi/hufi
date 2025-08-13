import { FC } from 'react';

import { NumericFormat } from 'react-number-format';

type Props = {
  value: number | string | undefined | null;
  prefix?: string;
};

const FormattedNumber: FC<Props> = ({ value, prefix = '' }) => {
  const _value = Number(value || 0);
  
  return (
    <NumericFormat
      displayType="text"
      value={_value}
      thousandsGroupStyle="thousand"
      thousandSeparator=","
      decimalScale={3}
      prefix={prefix}
    />
  );
};

export default FormattedNumber;

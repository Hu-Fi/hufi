import { type FC } from 'react';

import { Box, Stack } from '@mui/material';

type Props = {
  step: number;
};

const StepsIndicator: FC<Props> = ({ step }) => {
  return (
    <Stack direction="row" alignItems="center" gap={2}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Box
          key={index}
          width={150}
          height={9}
          bgcolor={step >= index + 1 ? 'primary.main' : 'background.default'}
          borderRadius="90px"
        />
      ))}
    </Stack>
  );
};

export default StepsIndicator;

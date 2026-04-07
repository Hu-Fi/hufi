import type { FC } from 'react';

import { CircularProgress } from '@mui/material';

const ModalLoading: FC = () => {
  return (
    <CircularProgress
      size={54}
      sx={{
        mx: 'auto',
        mb: 4,
        color: '#9354ff',
        '& .MuiCircularProgress-circle': { strokeWidth: '1.5px' },
      }}
    />
  );
};

export default ModalLoading;

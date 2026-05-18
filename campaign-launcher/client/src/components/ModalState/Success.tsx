import type { FC, PropsWithChildren } from 'react';

import { Box } from '@mui/material';

import { SuccessIcon } from '@/icons';

const ModalSuccess: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 'fit-content',
          flexShrink: 0,
          p: '12px',
          color: 'white',
          bgcolor: '#1a926e',
          borderRadius: 100,
        }}
      >
        <SuccessIcon sx={{ width: 34, height: 34 }} />
      </Box>
      {children}
    </>
  );
};

export default ModalSuccess;

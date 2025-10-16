import type { FC, PropsWithChildren } from 'react';

import { Box } from '@mui/material';

import { SuccessIcon } from '@/icons';

const ModalSuccess: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb={1}
        p="3px"
        color="white"
        bgcolor="success.main"
        borderRadius={100}
      >
        <SuccessIcon sx={{ width: 34, height: 34 }} />
      </Box>
      {children}
    </>
  );
};

export default ModalSuccess;

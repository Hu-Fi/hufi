import type { FC } from 'react';

import { Box, Typography } from '@mui/material';

import { CloseIcon } from '@/icons';

type Props = {
  message?: string;
};

const ModalError: FC<Props> = ({ message }) => {
  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb={1}
        p="3px"
        color="white"
        bgcolor="error.main"
        borderRadius={100}
      >
        <CloseIcon sx={{ width: 34, height: 34 }} />
      </Box>
      <Typography variant="subtitle2" color="error.main" mb={1} py={1}>
        {message}
      </Typography>
    </>
  );
};

export default ModalError;

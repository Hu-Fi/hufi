import { FC } from 'react';

import { Box, CircularProgress } from '@mui/material';

export const Loading: FC = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      width="100%"
      height="100%"
    >
      <CircularProgress />
    </Box>
  );
};

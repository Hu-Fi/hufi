import { FC } from 'react';

import { Box, Typography } from '@mui/material';

import { CloseIcon } from '../../icons';

const ModalError: FC = () => {
  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb={1}
        p="3px"
        color="background.default"
        bgcolor="error.main"
        borderRadius={100}
      >
        <CloseIcon sx={{ width: 34, height: 34 }} />
      </Box>
      <Typography variant="subtitle2" color="error.main" mb={1} py={1}>
        An error occurred, please try again.
      </Typography>
    </>
  );
};

export default ModalError;

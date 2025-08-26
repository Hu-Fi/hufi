import { FC } from 'react';

import { CircularProgress } from '@mui/material';

const ModalLoading: FC = () => {
  return <CircularProgress size={40} sx={{ mx: 'auto', mb: 4 }} />;
};

export default ModalLoading;

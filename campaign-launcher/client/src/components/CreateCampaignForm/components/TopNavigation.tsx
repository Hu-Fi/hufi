import { type FC } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton, Stack, Typography } from '@mui/material';

type Props = {
  step: number;
  handleBackClick: () => void;
};

const stepNames = ['Select Campaign Type', 'Create Escrow', 'Approve Tokens'];

const TopNavigation: FC<Props> = ({ step, handleBackClick }) => {
  return (
    <Stack direction="row" alignItems="center">
      <IconButton
        disableRipple
        sx={{ p: 0.5, color: 'text.primary', mr: 2 }}
        onClick={handleBackClick}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h6" component="h6">
        {step}. {stepNames[step - 1]}
      </Typography>
    </Stack>
  );
};

export default TopNavigation;

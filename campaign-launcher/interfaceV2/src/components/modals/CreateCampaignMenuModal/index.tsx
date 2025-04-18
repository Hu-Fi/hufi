import { FC } from 'react';

import { Box, Button, Typography } from '@mui/material';

import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
  handleOpenCreateCampaignModal: () => void;
};

const CreateCampaignMenuModal: FC<Props> = ({
  open,
  onClose,
  handleOpenCreateCampaignModal,
}) => {
  const handleClickOnStakeHMT = () => {
    onClose();
    window.open(import.meta.env.VITE_APP_STAKING_DASHBOARD_URL, '_blank');
  };

  const handleClickOnContinue = () => {
    onClose();
    handleOpenCreateCampaignModal();
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h4" color="text.primary" mb={7}>
        Create Campaign
      </Typography>
      <Box display="flex" flexDirection="column" alignItems="center" px={10}>
        <Typography
          component="p"
          variant="h5"
          color="text.primary"
          mb={2}
          textAlign="center"
        >
          To be able to create campaigns on the{' '}
          <strong>HUMAN Campaign Launcher</strong> you need to stake{' '}
          <strong>HMT</strong> on the <strong>HUMAN Staking Dashboard</strong>.
        </Typography>
        <Typography color="text.primary" mb={4} textAlign="center">
          To stake <strong>HMT</strong> click the button bellow, the staking
          dashboard will open on another browser tab. After you complete the
          staking process you can return to this tab. If you already have{' '}
          <strong>HMT</strong> staked just click the continue button.
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'secondary.main',
              color: 'secondary.contrast',
              fontWeight: 600,
            }}
            onClick={handleClickOnStakeHMT}
          >
            Stake HMT
          </Button>
          <Button
            variant="contained"
            size="large"
            sx={{ color: 'primary.contrast', fontWeight: 600 }}
            onClick={handleClickOnContinue}
          >
            Continue
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
};

export default CreateCampaignMenuModal;

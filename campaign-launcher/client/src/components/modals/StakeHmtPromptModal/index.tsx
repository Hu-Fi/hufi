import { FC, useState } from 'react';

import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Typography } from '@mui/material';

import { useStakeContext } from '../../../providers/StakeProvider';
import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
  handleOpenCreateCampaignModal: () => void;
};

const StakeHmtPromptModal: FC<Props> = ({
  open,
  onClose,
  handleOpenCreateCampaignModal,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const { refetchStakingData, isRefetching } = useStakeContext();

  const handleClose = () => {
    setShowWarning(false);
    onClose();
  };

  const handleClickOnStakeHMT = () => {
    handleClose();
    window.open(import.meta.env.VITE_APP_STAKING_DASHBOARD_URL, '_blank');
  };

  const handleClickOnContinue = async () => {
    if (isRefetching) return;

    const refreshedStakedAmount = await refetchStakingData();
    if (+(refreshedStakedAmount ?? '0') > 0) {
      handleClose();
      handleOpenCreateCampaignModal();
    } else {
      setShowWarning(true);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h4" color="text.primary" mb={{ xs: 3, md: 7 }}>
        Create Campaign
      </Typography>
      {showWarning ? (
        <>
          <WarningIcon color="inherit" sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="body1" color="text.primary" mb={4}>
            You haven&apos;t staked on this network yet.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => setShowWarning(false)}
          >
            Go Back
          </Button>
        </>
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          px={{ xs: 2, md: 10 }}
        >
          <Typography
            component="p"
            variant="h5"
            color="text.primary"
            mb={2}
            textAlign="center"
          >
            To be able to create campaigns on the{' '}
            <strong>HUMAN Campaign Launcher</strong> you need to stake{' '}
            <strong>HMT</strong> on the <strong>HUMAN Staking Dashboard</strong>
            .
          </Typography>
          <Typography color="text.primary" mb={4} textAlign="center">
            To stake <strong>HMT</strong> click the button below, the staking
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
              }}
              onClick={handleClickOnStakeHMT}
            >
              Stake HMT
            </Button>
            <Button
              variant="contained"
              size="large"
              sx={{ color: 'primary.contrast' }}
              onClick={handleClickOnContinue}
              disabled={isRefetching}
            >
              Continue
            </Button>
          </Box>
        </Box>
      )}
    </BaseModal>
  );
};

export default StakeHmtPromptModal;

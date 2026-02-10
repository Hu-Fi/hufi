import { type FC, useState } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useStakeContext } from '@/providers/StakeProvider';

import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

type WarningViewProps = {
  handleClickOnStakeHMT: () => void;
  handleClickOnUpdate: () => void;
};

const WarningView: FC<WarningViewProps> = ({
  handleClickOnStakeHMT,
  handleClickOnUpdate,
}) => {
  const isMobile = useIsMobile();

  return (
    <>
      <Typography
        variant="alert"
        color="text.secondary"
        mb={{ xs: 3, md: 4 }}
        mx="auto"
        display="flex"
        alignItems="center"
        gap={1}
      >
        Staked HMT
        <CancelIcon sx={{ color: 'error.main' }} />
      </Typography>
      <Typography
        variant="alert"
        color="text.primary"
        mb={2}
        textAlign="center"
      >
        You don&apos;t have any HMT staked on this network.
        <br />
        Please stake HMT on the Staking Dashboard to continue.
      </Typography>
      <Typography
        variant="body2"
        color="text.primary"
        mb={{ xs: 3, md: 4 }}
        textAlign="center"
      >
        If you&apos;ve already staked HMT, click <strong>Update</strong> to
        refresh your status and continue.
      </Typography>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection={{ xs: 'column', md: 'row' }}
        gap={{ xs: 2, md: 1 }}
      >
        <Button
          variant="contained"
          size="large"
          fullWidth={isMobile}
          onClick={handleClickOnStakeHMT}
        >
          Stake HMT
        </Button>
        <Button
          variant="contained"
          size="large"
          fullWidth={isMobile}
          sx={{
            bgcolor: 'secondary.main',
            color: 'secondary.contrast',
          }}
          onClick={handleClickOnUpdate}
        >
          Update
        </Button>
      </Box>
    </>
  );
};

const LoadingView: FC = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      flex={1}
      position="relative"
    >
      <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
        <CircularProgress size={32} />
      </Box>
      <Typography
        variant="alert"
        textAlign="center"
        position="absolute"
        bottom={0}
        left="50%"
        width="100%"
        sx={{ transform: 'translate(-50%, 0)' }}
      >
        Updating your staking status…
      </Typography>
    </Box>
  );
};

const StakingRequirementModal: FC<Props> = ({ open, onClose }) => {
  const [showWarning, setShowWarning] = useState(false);

  const navigate = useNavigate();
  const { fetchStakingData, isFetching } = useStakeContext();
  const isMobile = useIsMobile();

  const handleClose = () => {
    setShowWarning(false);
    onClose();
  };

  const handleClickOnStakeHMT = () => {
    window.open(import.meta.env.VITE_APP_STAKING_DASHBOARD_URL, '_blank');
  };

  const handleUpdateStakedAmount = async () => {
    const _updatedStakedAmount = Number(await fetchStakingData());
    if (_updatedStakedAmount === 0) {
      setShowWarning(true);
      return;
    } else {
      handleClose();
      navigate(ROUTES.LAUNCH_CAMPAIGN);
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
        height: { xs: 'auto', md: '360px' },
        minHeight: { xs: '440px', md: 'unset' },
        maxHeight: { xs: '600px', md: 'unset' },
        px: { xs: 2, md: 8 },
      }}
    >
      <Typography
        variant="h4"
        color="text.primary"
        mb={3}
        textAlign="center"
        sx={{ whiteSpace: 'pre-line' }}
      >
        {isMobile ? 'Launch\nCampaign' : 'Create a Campaign'}
      </Typography>
      <Stack width="100%" flex={1} mt={isFetching ? -3 : 0}>
        {isFetching && <LoadingView />}
        {!isFetching && showWarning && (
          <WarningView
            handleClickOnStakeHMT={handleClickOnStakeHMT}
            handleClickOnUpdate={handleUpdateStakedAmount}
          />
        )}
        {!isFetching && !showWarning && (
          <>
            <Typography
              variant="alert"
              mt={{ xs: 0, md: 5 }}
              mb={2}
              px={{ xs: 0, md: 7 }}
              textAlign="center"
            >
              To be able to create campaigns on the HuFi Campaign Launcher you
              need to stake HMT on the Staking Dashboard.
            </Typography>
            <Typography
              variant="body2"
              textAlign="center"
              mb={{ xs: 3, md: 6 }}
            >
              Once staked, return here to continue.
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection={{ xs: 'column', md: 'row' }}
              gap={{ xs: 2, md: 1 }}
            >
              <Button
                variant="contained"
                size="large"
                fullWidth={isMobile}
                onClick={handleClickOnStakeHMT}
              >
                Stake HMT
              </Button>
              <Button
                variant="contained"
                size="large"
                fullWidth={isMobile}
                sx={{
                  bgcolor: 'secondary.main',
                  color: 'secondary.contrast',
                }}
                onClick={handleUpdateStakedAmount}
              >
                Continue
              </Button>
            </Box>
          </>
        )}
      </Stack>
    </BaseModal>
  );
};

export default StakingRequirementModal;

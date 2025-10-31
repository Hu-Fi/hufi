import { type FC, useCallback, useEffect, useState } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/CheckCircle';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { ROUTES } from '@/constants';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useStakeContext } from '@/providers/StakeProvider';
import { CampaignType } from '@/types';
import { convertFromSnakeCaseToTitleCase } from '@/utils';

import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
  campaignType: CampaignType | null;
  handleChangeCampaignType: (type: CampaignType) => void;
  handleOpenFormModal: () => void;
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

const CampaignSetupModal: FC<Props> = ({
  open,
  onClose,
  campaignType,
  handleChangeCampaignType,
  handleOpenFormModal,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [stakedAmount, setStakedAmount] = useState(0);

  const { fetchStakingData, isFetching } = useStakeContext();
  const isMobile = useIsMobile();

  const getStakedAmount = useCallback(async () => {
    const _stakedAmount = Number(await fetchStakingData());
    setStakedAmount(_stakedAmount);
    return _stakedAmount;
  }, [fetchStakingData]);

  useEffect(() => {
    getStakedAmount();
  }, [getStakedAmount]);

  const handleClose = () => {
    setShowWarning(false);
    onClose();
  };

  const handleClickOnStakeHMT = () => {
    window.open(import.meta.env.VITE_APP_STAKING_DASHBOARD_URL, '_blank');
  };

  const handleUpdateStakedAmount = async () => {
    const _updatedStakedAmount = await getStakedAmount();
    setShowWarning(_updatedStakedAmount === 0);
  };

  const showFirstStep = !isFetching && !showWarning && stakedAmount === 0;
  const showSecondStep = !isFetching && !showWarning && stakedAmount > 0;

  const handleClickOnContinue = async () => {
    if (!campaignType) return;

    handleClose();
    handleOpenFormModal();
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
        {showFirstStep && (
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
        {showSecondStep && (
          <>
            <Typography
              variant="alert"
              color="text.secondary"
              mb={{ xs: 3, md: 5 }}
              mx="auto"
              display="flex"
              alignItems="center"
              gap={1}
            >
              Staked HMT
              <CheckIcon sx={{ color: 'success.main' }} />
            </Typography>
            <Typography variant="alert" mb={2} textAlign="center">
              Please select your campaign type to begin creating your campaign
              on HuFi.
            </Typography>
            <Link
              to={ROUTES.SUPPORT}
              component={RouterLink}
              target="_blank"
              sx={{
                width: 'fit-content',
                mb: { xs: 3, md: 5 },
                mx: 'auto',
              }}
            >
              <Typography variant="body2" fontWeight={700}>
                What are the campaign types?
              </Typography>
            </Link>
            <Stack
              gap={1}
              direction={{ xs: 'column', md: 'row' }}
              mx={{ xs: 0, md: 'auto' }}
            >
              <Autocomplete
                size="small"
                value={campaignType}
                onChange={(_, value) =>
                  handleChangeCampaignType(value as CampaignType)
                }
                options={[...Object.values(CampaignType), null]}
                getOptionLabel={(option) => {
                  if (option === null) return 'Coming soon...';
                  return convertFromSnakeCaseToTitleCase(option);
                }}
                getOptionDisabled={(option) => option === null}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Campaign Type"
                    sx={{
                      '& .MuiInputBase-root': {
                        height: 42,
                      },
                    }}
                  />
                )}
                sx={{ width: { xs: '100%', sm: 220 } }}
                slotProps={{
                  paper: {
                    elevation: 4,
                    sx: {
                      bgcolor: 'background.default',
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                size="large"
                fullWidth={isMobile}
                sx={{
                  color: 'primary.contrast',
                  width: { xs: '100%', md: 93 },
                }}
                disabled={!campaignType}
                onClick={handleClickOnContinue}
              >
                Continue
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </BaseModal>
  );
};

export default CampaignSetupModal;

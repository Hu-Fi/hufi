import { FC, useState } from "react";

import WarningIcon from '@mui/icons-material/Warning';
import { Autocomplete, Button, CircularProgress, Divider, Link, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { ROUTES } from "../../../constants";
import { useStakeContext } from "../../../providers/StakeProvider";
import { CampaignType } from "../../../types";
import { convertFromSnakeCaseToTitleCase } from "../../../utils";
import BaseModal from "../BaseModal";
import CreateCampaignModal from "../CreateCampaignModal"

type Props = {
  open: boolean;
  onClose: () => void;
};

const WarningView: FC<{ handleGoBack: () => void }> = ({ handleGoBack }) => {
  return (
    <>
      <WarningIcon color="inherit" sx={{ fontSize: 40, mb: 2 }} />
      <Typography variant="body1" color="text.primary" mb={4}>
        You haven&apos;t staked on this network yet.
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={handleGoBack}
      >
        Go Back
      </Button>
    </>
  )
}

const CampaignSetupModal: FC<Props> = ({ open, onClose }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const { fetchStakingData, isFetching } = useStakeContext();

  const handleClose = () => {
    setShowWarning(false);
    setCampaignType(null);
    onClose();
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    handleClose();
  };
  
  const handleClickOnStakeHMT = () => {
    onClose();
    window.open(import.meta.env.VITE_APP_STAKING_DASHBOARD_URL, '_blank');
  };

  const handleGoBack = () => {
    setShowWarning(false);
  }

  const isContinueDisabled = !campaignType || isFetching;

  const handleClickOnContinue = async () => {
    if (isContinueDisabled) return;
    
    const stakedAmount = await fetchStakingData();
    if (+(stakedAmount ?? '0') > 0) {
      setIsFormModalOpen(true);
    } else {
      setShowWarning(true);
    }
  };

  return (
    <>
      <BaseModal
        open={open}
        onClose={handleClose}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 4,
          pb: { xs: 4, md: 6 },
          px: { xs: 3, md: 8 },
        }}
      >
        <Typography variant="h4" color="text.primary" mb={3}>
          Create a Campaign
        </Typography>
        {
          showWarning ? (
            <WarningView handleGoBack={handleGoBack} />
          ) : (
            <Stack gap={4} direction={{ xs: "column", md: "row" }}>
              <Stack gap={2} flex={1}>
                <Typography variant="alert">
                  To be able to create campaigns on the HuFi Campaign Launcher 
                  you need to stake HMT on the Staking Dashboard.
                </Typography>
                <Typography variant="body2">
                  To create a campaign on HuFi, you need to &quot;Stake HMT&quot;. 
                  Once staked, return here to continue. If already staked, choose a campaign type.
                </Typography>
                <Link 
                  to={ROUTES.SUPPORT} 
                  component={RouterLink}
                  target="_blank"
                  sx={{ width: 'fit-content' }}
                >
                  <Typography variant="body2" fontWeight={700}>
                    What are the campaign types?
                  </Typography>
                </Link>
              </Stack>
              <Stack flex={1}>
                <Typography variant="subtitle2" mb={1}>
                  Step 1: Stake HMT
                </Typography>
                <Button 
                  variant="contained" 
                  size="large" 
                  sx={{ 
                    bgcolor: 'secondary.main', 
                    color: 'secondary.contrast' 
                  }}
                  onClick={handleClickOnStakeHMT}
                >
                  Stake HMT
                </Button>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" mb={1}>
                  Step 2: Choose a campaign type
                </Typography>
                <Stack gap={1} direction="row">
                  <Autocomplete
                    size="small"
                    value={campaignType}
                    onChange={(_, value) => setCampaignType(value)}
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
                            height: 42
                          }
                        }}
                      />
                    )}
                    sx={{ flex: 1 }}
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
                    sx={{ color: 'primary.contrast', width: 110 }}
                    disabled={isContinueDisabled}
                    onClick={handleClickOnContinue}
                  >
                    {isFetching ? <CircularProgress size={20} /> : 'Continue'}
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          )
        }
      </BaseModal>
      {campaignType && (
        <CreateCampaignModal
          open={isFormModalOpen}
          onClose={handleCloseFormModal}
          campaignType={campaignType}
        />
      )}
    </>
  )
};

export default CampaignSetupModal;

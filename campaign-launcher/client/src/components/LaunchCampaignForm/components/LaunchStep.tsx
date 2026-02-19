import { type FC } from 'react';

import { Box, Button, CircularProgress, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router';

import { useIsMobile } from '@/hooks/useBreakpoints';
import useCreateEscrow from '@/hooks/useCreateEscrow';
import { useNetwork } from '@/providers/NetworkProvider';
import { type CampaignFormValues } from '@/types';
import { constructCampaignDetails } from '@/utils';

import { SummaryCard, ErrorView, FinalView } from '.';

type Props = {
  fundAmount: string;
  formValues: CampaignFormValues;
  handleChangeStep: (step: number) => void;
  handleStartOver: () => void;
};

const LaunchStep: FC<Props> = ({
  fundAmount,
  formValues,
  handleChangeStep,
  handleStartOver,
}) => {
  const {
    data: escrowData,
    mutate: createEscrow,
    reset: resetCreateEscrow,
    isLoading: isCreatingEscrow,
    isSuccess: isEscrowCreated,
    isError,
  } = useCreateEscrow();

  const navigate = useNavigate();
  const { appChainId } = useNetwork();
  const isMobile = useIsMobile();

  const handleBackToEdit = () => {
    handleChangeStep(3);
  };

  const handleLaunchCampaign = async () => {
    const data = {
      ...formValues,
      fund_amount: fundAmount,
    };
    await createEscrow(data);
  };

  const handleTryAgainClick = () => {
    resetCreateEscrow();
  };

  const onStartOverClick = () => {
    resetCreateEscrow();
    handleStartOver();
  };

  const onViewCampaignDetailsClick = () => {
    if (!escrowData) return;

    const formData = {
      ...formValues,
      fund_amount: fundAmount,
    };

    const {
      escrowAddress,
      tokenDecimals,
      exchangeOracleFee,
      recordingOracleFee,
      reputationOracleFee,
    } = escrowData;
    const fees = {
      exchangeOracleFee: exchangeOracleFee,
      recordingOracleFee: recordingOracleFee,
      reputationOracleFee: reputationOracleFee,
    };
    const payload = constructCampaignDetails({
      chainId: appChainId,
      address: escrowAddress,
      data: formData,
      tokenDecimals,
      fees,
    });
    const encodedData = btoa(JSON.stringify(payload));
    navigate(`/campaign-details/${escrowAddress}?data=${encodedData}`);
  };

  return (
    <Paper
      elevation={24}
      sx={{
        width: { xs: '100%', md: '600px' },
        mx: 'auto',
        mt: 0,
        maxHeight: '500px',
        gap: 2,
        bgcolor: 'background.default',
        boxShadow: 'none',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {isEscrowCreated && (
        <FinalView
          campaignType={formValues.type}
          onViewDetails={onViewCampaignDetailsClick}
          handleStartOver={onStartOverClick}
        />
      )}
      {isError && <ErrorView onRetry={handleTryAgainClick} />}
      {isCreatingEscrow && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          width="100%"
          height="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1,
            backdropFilter: 'blur(1px)',
          }}
        >
          <CircularProgress size={80} />
        </Box>
      )}
      {!isError && !isEscrowCreated && (
        <>
          <SummaryCard
            step={4}
            fundAmount={fundAmount}
            formValues={formValues}
          />
          <Stack direction="row" justifyContent="space-between" mt={4} gap={0}>
            <Button
              size={isMobile ? 'medium' : 'large'}
              variant="contained"
              disabled={isCreatingEscrow}
              sx={{ borderRadius: '0px', flex: 1, boxShadow: 'none' }}
              onClick={handleBackToEdit}
            >
              Back to Edit
            </Button>
            <Button
              size={isMobile ? 'medium' : 'large'}
              variant="contained"
              disabled={isCreatingEscrow}
              sx={{ borderRadius: '0px', flex: 1, boxShadow: 'none' }}
              onClick={handleLaunchCampaign}
            >
              Launch Campaign
            </Button>
          </Stack>
        </>
      )}
    </Paper>
  );
};

export default LaunchStep;

import { type SetStateAction, type Dispatch, type FC, useEffect } from 'react';

import { type ChainId } from '@human-protocol/sdk';
import { Box, Button, CircularProgress, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router';

import { ROUTES } from '@/constants';
import { useIsMobile } from '@/hooks/useBreakpoints';
import useCreateEscrow from '@/hooks/useCreateEscrow';
import { type CampaignFormValues } from '@/types';
import { constructCampaignDetails } from '@/utils';

import { SummaryCard, ErrorView, FinalView, BottomNavigation } from '.';

type Props = {
  chainId: ChainId;
  fundAmount: string;
  formValues: CampaignFormValues;
  handleChangeStep: Dispatch<SetStateAction<number>>;
  handleStartOver: () => void;
  setIsEscrowCreated: (isCreated: boolean) => void;
};

const LaunchStep: FC<Props> = ({
  chainId,
  fundAmount,
  formValues,
  handleChangeStep,
  handleStartOver,
  setIsEscrowCreated,
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
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isEscrowCreated) {
      setIsEscrowCreated(true);
    }
  }, [isEscrowCreated, setIsEscrowCreated]);

  const handleBackToEdit = () => {
    handleChangeStep((prev) => prev - 1);
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
    resetCreateEscrow(); // just a safety-belt in case something is cached
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
      chainId,
      address: escrowAddress,
      data: formData,
      tokenDecimals,
      fees,
    });
    const encodedData = btoa(JSON.stringify(payload));
    navigate(`/campaign-details/${escrowAddress}?data=${encodedData}`);
  };

  return (
    <>
      <Stack width="100%" mt={5} gridArea="main">
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '500px' },
            mx: 'auto',
            height: 'fit-content',
            gap: 2,
            bgcolor: '#251d47',
            borderRadius: '8px',
            border: '1px solid #433679',
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
                step={5}
                chainId={chainId}
                fundAmount={fundAmount}
                formValues={formValues}
              />
              {!isMobile && (
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  mt={0}
                  py={1.5}
                  px={2}
                  gap={1.5}
                  bgcolor="#302854"
                >
                  <Button
                    size="large"
                    variant="outlined"
                    disabled={isCreatingEscrow}
                    sx={{
                      borderRadius: '4px',
                      flex: 1,
                      color: 'white',
                      borderColor: '#433679',
                    }}
                    onClick={handleBackToEdit}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    size="large"
                    variant="contained"
                    color="error"
                    disabled={isCreatingEscrow}
                    sx={{
                      borderRadius: '4px',
                      flex: 1,
                      boxShadow: 'none',
                      '&:hover': { boxShadow: 'none' },
                    }}
                    onClick={handleLaunchCampaign}
                  >
                    Go Live
                  </Button>
                </Stack>
              )}
            </>
          )}
        </Paper>
      </Stack>
      {isMobile && !isEscrowCreated && (
        <BottomNavigation
          handleBackClick={handleBackToEdit}
          handleNextClick={handleLaunchCampaign}
          disableBackButton={isCreatingEscrow}
          disableNextButton={isCreatingEscrow}
          nextButtonText="Go Live"
        />
      )}
      {isMobile && isEscrowCreated && (
        <BottomNavigation
          handleNextClick={() => navigate(ROUTES.DASHBOARD)}
          nextButtonText="Back to Dashboard"
        />
      )}
    </>
  );
};

export default LaunchStep;

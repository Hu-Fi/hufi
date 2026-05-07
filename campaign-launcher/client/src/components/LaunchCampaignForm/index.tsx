import { useEffect, useState, type FC } from 'react';

import { type ChainId } from '@human-protocol/sdk';
import { Box } from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';
import { type CampaignFormValues } from '@/types';

import {
  NetworkStep,
  CampaignTypeStep,
  EscrowDetailsStep,
  ApprovalStep,
  LaunchStep,
  SummaryCard,
  StepsIndicator,
} from './components';

const steps = [
  'Select Network',
  'Select Campaign Type',
  'Create Escrow',
  'Approve Tokens',
  'One final look before you initiate the campaign',
];

const LaunchCampaignForm: FC = () => {
  const [step, setStep] = useState(1);
  const [chainId, setChainId] = useState<ChainId | null>(null);
  const [fundAmount, setFundAmount] = useState<string>('');
  const [formValues, setFormValues] = useState<CampaignFormValues | null>(null);

  const isMobile = useIsMobile();

  const handleStartOver = () => {
    setStep(1);
    setFundAmount('');
    setFormValues(null);
    setChainId(null);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const isLastStep = step === steps.length;

  return (
    <Box
      sx={{
        display: { xs: 'flex', md: isLastStep ? 'flex' : 'grid' },
        gridTemplateColumns: isLastStep ? undefined : '2fr 1fr',
        gridTemplateRows: '64px auto auto',
        columnGap: 12,
        flex: isLastStep ? 0 : 1,
        flexDirection: 'column',
        gridTemplateAreas: isLastStep
          ? undefined
          : `
            "stepper aside"
            "main aside"
            "bottomNav bottomNav"
          `,
        zIndex: { xs: 1, md: 2 },
      }}
    >
      {!isLastStep && <StepsIndicator currentStep={step} steps={steps} />}
      {step === 1 && (
        <NetworkStep
          chainId={chainId}
          handleSetNetwork={setChainId}
          handleChangeStep={setStep}
        />
      )}
      {step === 2 && (
        <CampaignTypeStep
          formValues={formValues}
          setFormValues={setFormValues}
          handleChangeStep={setStep}
        />
      )}
      {step === 3 && formValues && (
        <EscrowDetailsStep
          formValues={formValues}
          setFormValues={setFormValues}
          handleChangeStep={setStep}
        />
      )}
      {step === 4 && formValues && (
        <ApprovalStep
          fundAmount={fundAmount}
          setFundAmount={setFundAmount}
          formValues={formValues}
          handleChangeStep={setStep}
        />
      )}
      {step === 5 && formValues && chainId && (
        <LaunchStep
          chainId={chainId}
          fundAmount={fundAmount}
          formValues={formValues}
          handleChangeStep={setStep}
          handleStartOver={handleStartOver}
        />
      )}
      {!isLastStep && !isMobile && (
        <SummaryCard step={step} chainId={chainId} formValues={formValues} />
      )}
    </Box>
  );
};

export default LaunchCampaignForm;

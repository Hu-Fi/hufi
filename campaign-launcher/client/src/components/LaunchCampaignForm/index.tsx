import { useEffect, useState, type FC } from 'react';

import { Stack } from '@mui/material';

import { type CampaignFormValues } from '@/types';

import {
  TopNavigation,
  FirstStep,
  SecondStep,
  ThirdStep,
  LaunchStep,
} from './components';

const LaunchCampaignForm: FC = () => {
  const [step, setStep] = useState(1);
  const [fundAmount, setFundAmount] = useState<string>('');
  const [formValues, setFormValues] = useState<CampaignFormValues | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  return (
    <Stack
      gap={2}
      mt={{ xs: 0, md: 4 }}
      minHeight={{ xs: 'auto', md: '600px' }}
    >
      {step < 4 && (
        <TopNavigation step={step} handleBackClick={() => setStep(step - 1)} />
      )}
      {step === 1 && (
        <FirstStep
          formValues={formValues}
          setFormValues={setFormValues}
          handleChangeStep={setStep}
        />
      )}
      {step === 2 && (
        <SecondStep
          formValues={formValues as CampaignFormValues}
          setFormValues={setFormValues}
          handleChangeStep={setStep}
        />
      )}
      {step === 3 && (
        <ThirdStep
          fundAmount={fundAmount}
          setFundAmount={setFundAmount}
          formValues={formValues as CampaignFormValues}
          handleChangeStep={setStep}
        />
      )}
      {step === 4 && (
        <LaunchStep
          fundAmount={fundAmount}
          formValues={formValues as CampaignFormValues}
          handleChangeStep={setStep}
        />
      )}
    </Stack>
  );
};

export default LaunchCampaignForm;

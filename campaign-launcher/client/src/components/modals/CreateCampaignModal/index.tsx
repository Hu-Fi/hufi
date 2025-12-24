import { type FC, useCallback, useState } from 'react';

import { type CampaignType } from '@/types';

import BaseModal from '../BaseModal';

import { FirstStep, SecondStep } from './components';

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormValues = {
  campaignType: CampaignType | null;
  fundToken: string;
  fundAmount: string;
};

const CreateCampaignModal: FC<Props> = ({ open, onClose }) => {
  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState<FormValues>({
    campaignType: null,
    fundToken: '',
    fundAmount: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const prepareFormValues = useCallback((newState: FormValues) => {
    setFormValues((prev) => ({
      ...prev,
      ...newState,
    }));
  }, []);

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      isLoading={isLoading}
      showCloseButton={false}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 2, md: 4 },
        '& > form': {
          width: { xs: '100%', md: 'auto' },
        },
      }}
    >
      {step === 1 && (
        <FirstStep
          prepareFormValues={prepareFormValues}
          handleChangeFormStep={setStep}
          handleChangeLoading={setIsLoading}
          handleCloseModal={handleClose}
        />
      )}
      {step === 2 && formValues.campaignType && (
        <SecondStep
          formValues={formValues as FormValues & { campaignType: CampaignType }}
          handleChangeLoading={setIsLoading}
          handleChangeFormStep={setStep}
          handleCloseModal={handleClose}
        />
      )}
    </BaseModal>
  );
};

export default CreateCampaignModal;

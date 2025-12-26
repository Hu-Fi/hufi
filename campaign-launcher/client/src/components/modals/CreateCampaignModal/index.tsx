import { type FC, useCallback, useState } from 'react';

import { useIsMobile } from '@/hooks/useBreakpoints';
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

type FilledFormValues = FormValues & {
  campaignType: CampaignType;
};

const CreateCampaignModal: FC<Props> = ({ open, onClose }) => {
  const [step, setStep] = useState(1);
  const [showFinalView, setShowFinalView] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({
    campaignType: null,
    fundToken: '',
    fundAmount: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const isMobile = useIsMobile();

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
      showCloseButton={isMobile}
      showBackButton={isMobile && step === 2 && !showFinalView}
      handleBackClick={() => setStep(1)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 2, md: 4 },
      }}
    >
      {step === 1 && (
        <FirstStep
          prepareFormValues={prepareFormValues}
          handleChangeLoading={setIsLoading}
          handleChangeFormStep={setStep}
          handleCloseModal={handleClose}
        />
      )}
      {step === 2 && (
        <SecondStep
          formValues={formValues as FilledFormValues}
          showFinalView={showFinalView}
          setShowFinalView={setShowFinalView}
          handleChangeLoading={setIsLoading}
          handleChangeFormStep={setStep}
          handleCloseModal={handleClose}
        />
      )}
    </BaseModal>
  );
};

export default CreateCampaignModal;

import { type FC, useEffect } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { Stack } from '@mui/material';
import {
  type Control,
  useForm,
  type UseFormTrigger,
  type UseFormWatch,
} from 'react-hook-form';

import { useIsMobile } from '@/hooks/useBreakpoints';
import {
  type MarketMakingFormValues,
  type CampaignFormValues,
  CampaignType,
  type ThresholdFormValues,
  type HoldingFormValues,
} from '@/types';

import { campaignValidationSchema } from '../validation';

import {
  MarketMakingForm,
  ThresholdForm,
  HoldingForm,
  BottomNavigation,
  SummaryCard,
} from '.';

type Props = {
  formValues: CampaignFormValues;
  setFormValues: (values: CampaignFormValues) => void;
  handleChangeStep: (step: number) => void;
};

const SecondStep: FC<Props> = ({
  formValues,
  setFormValues,
  handleChangeStep,
}) => {
  const isMobile = useIsMobile();

  const {
    control,
    formState: { errors },
    watch,
    trigger,
    handleSubmit,
  } = useForm<CampaignFormValues>({
    mode: isMobile ? 'onSubmit' : 'onBlur',
    resolver: yupResolver(campaignValidationSchema),
    defaultValues: formValues,
    shouldFocusError: isMobile,
  });

  useEffect(() => {
    if (isMobile && Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(
        `[name="${firstErrorField}"]`
      ) as HTMLElement;

      if (errorElement) {
        errorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [isMobile, errors]);

  const campaignType = formValues.type as CampaignType;

  const onSubmit = async (data: CampaignFormValues) => {
    setFormValues(data);
    handleChangeStep(3);
  };

  return (
    <>
      <Stack width="100%" mt={0}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack
            direction="row"
            justifyContent="space-between"
            gap={{ sm: 3, md: 2 }}
          >
            <Stack
              gap={{ xs: 4, md: 3 }}
              maxWidth="600px"
              width={{ xs: '100%', md: 'auto' }}
              sx={{
                '& .MuiFormHelperText-root': {
                  mt: 0.5,
                  mx: 0,
                },
              }}
            >
              {campaignType === CampaignType.MARKET_MAKING && (
                <MarketMakingForm
                  control={control as Control<MarketMakingFormValues>}
                  errors={errors}
                  watch={watch as UseFormWatch<MarketMakingFormValues>}
                  trigger={trigger as UseFormTrigger<MarketMakingFormValues>}
                  campaignType={campaignType}
                />
              )}
              {campaignType === CampaignType.HOLDING && (
                <HoldingForm
                  control={control as Control<HoldingFormValues>}
                  errors={errors}
                  watch={watch as UseFormWatch<HoldingFormValues>}
                  trigger={trigger as UseFormTrigger<HoldingFormValues>}
                  campaignType={campaignType}
                />
              )}
              {campaignType === CampaignType.THRESHOLD && (
                <ThresholdForm
                  control={control as Control<ThresholdFormValues>}
                  errors={errors}
                  watch={watch as UseFormWatch<ThresholdFormValues>}
                  trigger={trigger as UseFormTrigger<ThresholdFormValues>}
                  campaignType={campaignType}
                />
              )}
            </Stack>
            {!isMobile && <SummaryCard step={2} formValues={formValues} />}
          </Stack>
          <BottomNavigation
            step={2}
            nextButtonType="submit"
            handleNextClick={() => {}}
            handleBackClick={() => handleChangeStep(1)}
          />
        </form>
      </Stack>
    </>
  );
};

export default SecondStep;

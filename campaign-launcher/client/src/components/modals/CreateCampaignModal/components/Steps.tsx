import type { FC } from 'react';

import {
  CircularProgress,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
} from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';

type Props = {
  stepsCompleted: number;
  steps: string[];
  isLoading: boolean;
};

const Steps: FC<Props> = ({ stepsCompleted, steps, isLoading }) => {
  const isMobile = useIsMobile();

  return (
    <Stepper
      activeStep={stepsCompleted}
      orientation={isMobile ? 'vertical' : 'horizontal'}
      connector={isMobile ? null : <StepConnector />}
      sx={{
        my: 0,
        mx: 'auto',
        gap: { xs: '20px', md: 0 },
        width: { xs: 'fit-content', md: '100%' },
      }}
    >
      {steps.map((step, idx) => {
        const stepProps: { completed?: boolean } = {};
        if (idx < stepsCompleted) {
          stepProps.completed = true;
        }
        return (
          <Step key={step} {...stepProps}>
            <StepLabel
              slotProps={{
                root: {
                  sx: {
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 1,
                    '& .MuiStepLabel-iconContainer': {
                      p: 0,
                    },
                  },
                },
                stepIcon: {
                  icon:
                    isLoading && idx === stepsCompleted ? (
                      <CircularProgress size={24} />
                    ) : (
                      idx + 1
                    ),
                  sx: {
                    '&.Mui-completed': {
                      color: 'success.main',
                    },
                  },
                },
              }}
            >
              {step}
            </StepLabel>
          </Step>
        );
      })}
    </Stepper>
  );
};

export default Steps;

import type { FC } from 'react';

import { CircularProgress, Step, StepLabel, Stepper } from '@mui/material';

type Props = {
  stepsCompleted: number;
  steps: string[];
  isCreatingEscrow: boolean;
};

const Steps: FC<Props> = ({ stepsCompleted, steps, isCreatingEscrow }) => {
  return (
    <Stepper activeStep={stepsCompleted} sx={{ mb: 2, width: '100%' }}>
      {steps.map((step, idx) => {
        const stepProps: { completed?: boolean } = {};
        if (idx < stepsCompleted) {
          stepProps.completed = true;
        }
        return (
          <Step key={step} {...stepProps}>
            <StepLabel
              slotProps={{
                stepIcon: {
                  icon:
                    isCreatingEscrow && idx === stepsCompleted ? (
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

import { type FC } from 'react';

import { Box, Link, Stack, Typography } from '@mui/material';

import CustomTooltip from '@/components/CustomTooltip';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import { useIsMobile } from '@/hooks/useBreakpoints';

const CampaignTypeTooltip: FC = () => {
  const isMobile = useIsMobile();
  return (
    <CustomTooltip
      arrow
      placement={isMobile ? 'left' : 'right'}
      sx={{ ml: 1 }}
      title={
        <Link
          href="https://docs.hu.finance/holding/"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: 'primary.contrastText',
            textDecoration: 'underline',
          }}
        >
          What are the campaign types?
        </Link>
      }
    >
      <InfoTooltipInner />
    </CustomTooltip>
  );
};

type Props = {
  steps: string[];
  currentStep: number;
};

const StepsIndicator: FC<Props> = ({ steps, currentStep }) => {
  const isMobile = useIsMobile();
  const isLastStep = currentStep === steps.length;

  return (
    <Stack
      sx={{
        gap: { xs: 2, md: 3 },
        gridArea: 'stepper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'center', md: 'center' },
          gap: 0.5,
        }}
      >
        {!isLastStep && (
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            sx={{ color: 'neutral.100', fontWeight: { xs: 700, md: 600 } }}
          >
            {currentStep}.
          </Typography>
        )}
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          sx={{ color: 'neutral.100', fontWeight: { xs: 700, md: 600 } }}
        >
          {steps[currentStep - 1]}
        </Typography>
        {currentStep === 2 && <CampaignTypeTooltip />}
      </Box>
      {!isLastStep && (
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: { xs: 1, md: 2 },
          }}
        >
          {steps.map((step, index) => (
            <Box
              key={step}
              sx={{
                display: index === steps.length - 1 ? 'none' : 'flex',
                maxWidth: 100,
                flexGrow: 1,
                height: 9,
                bgcolor:
                  currentStep >= index + 1
                    ? 'primary.main'
                    : 'background.paper',
                borderRadius: '90px',
              }}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default StepsIndicator;

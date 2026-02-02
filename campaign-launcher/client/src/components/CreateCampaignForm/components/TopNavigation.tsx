import { type FC } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton, Link, Stack, Typography } from '@mui/material';

import CustomTooltip from '@/components/CustomTooltip';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import { useIsMobile } from '@/hooks/useBreakpoints';

type Props = {
  step: number;
  handleBackClick: () => void;
};

const stepNames = ['Select Campaign Type', 'Create Escrow', 'Approve Tokens'];

const TopNavigation: FC<Props> = ({ step, handleBackClick }) => {
  const isMobile = useIsMobile();

  return (
    <Stack direction="row" alignItems="center">
      <IconButton
        disableRipple
        sx={{ p: 0.5, color: 'text.primary', mr: 2 }}
        onClick={handleBackClick}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h6" component="h6">
        {step}. {stepNames[step - 1]}
      </Typography>
      {step === 1 && (
        <CustomTooltip
          arrow
          placement={isMobile ? 'left' : 'right'}
          sx={{ ml: 2 }}
          title={
            <Link
              href="https://docs.hu.finance/holding/"
              target="_blank"
              rel="noopener noreferrer"
              color="primary.contrast"
            >
              What are the campaign types?
            </Link>
          }
        >
          <InfoTooltipInner />
        </CustomTooltip>
      )}
    </Stack>
  );
};

export default TopNavigation;

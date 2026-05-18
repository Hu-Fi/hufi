import type { FC } from 'react';

import { Button, Stack, Typography } from '@mui/material';

import { ModalSuccess } from '@/components/ModalState';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { type CampaignType } from '@/types';
import { mapTypeToLabel } from '@/utils';

type Props = {
  campaignType: CampaignType;
  onViewDetails: () => void;
  handleStartOver: () => void;
};

const FinalView: FC<Props> = ({
  campaignType,
  onViewDetails,
  handleStartOver,
}) => {
  const isMobile = useIsMobile();

  return (
    <Stack
      sx={{
        gap: 2,
        alignItems: 'center',
        textAlign: 'center',
        py: { xs: 2, md: 3 },
        px: { xs: 2, md: 3 },
      }}
    >
      <ModalSuccess />
      <Typography
        variant="h5"
        sx={{
          color: 'text.primary',
          fontWeight: 700,
        }}
      >
        Congratulations!
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontWeight: 500,
          color: '#a0a0a0',
        }}
      >
        Your {mapTypeToLabel(campaignType)} campaign has been successfully
        launched.
        <br />
        Everything is set up and ready to go.
      </Typography>
      <Stack
        sx={{
          mt: 2,
          gap: 2,
          width: { xs: '100%', md: 'fit-content' },
        }}
      >
        <Button
          size="large"
          variant="outlined"
          fullWidth={isMobile}
          sx={{ color: 'white', borderColor: '#433679' }}
          onClick={onViewDetails}
        >
          View campaign details page
        </Button>
        <Button
          size="large"
          variant="contained"
          color="error"
          fullWidth={isMobile}
          onClick={handleStartOver}
        >
          Launch another campaign
        </Button>
      </Stack>
    </Stack>
  );
};

export default FinalView;

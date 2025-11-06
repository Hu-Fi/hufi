import type { FC } from 'react';

import { Button, Stack, Typography } from '@mui/material';

import { ModalSuccess } from '@/components/ModalState';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { type CampaignType } from '@/types';
import { mapTypeToLabel } from '@/utils';

type Props = {
  campaignType: CampaignType;
  onViewDetails: () => void;
};

const FinalView: FC<Props> = ({ campaignType, onViewDetails }) => {
  const isMobile = useIsMobile();

  return (
    <Stack gap={2} alignItems="center" textAlign="center">
      <ModalSuccess />
      <Typography variant="h4" color="text.primary" mt={1}>
        Congratulations!
      </Typography>
      <Typography variant="body1" fontWeight={500}>
        Your {mapTypeToLabel(campaignType)} campaign has been successfully
        launched.
        <br />
        Everything is set up and ready to go.
      </Typography>
      <Typography variant="body2">
        Click the button below to view the campaign details.
      </Typography>
      <Button
        size="large"
        variant="contained"
        fullWidth={isMobile}
        sx={{ mt: 2, mx: 'auto' }}
        onClick={onViewDetails}
      >
        View campaign details page
      </Button>
    </Stack>
  );
};

export default FinalView;

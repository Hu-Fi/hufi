import { useState, type FC } from 'react';

import { Box, Button, Typography } from '@mui/material';

import { useSignerContext } from '@/providers/SignerProvider';
import { CampaignStatus, type Campaign } from '@/types';

import CancelCampaignDialog from './CancelCampaignDialog';

type Props = {
  campaign: Campaign;
};

// TODO: Update the copy
const CancelCampaignSection: FC<Props> = ({ campaign }) => {
  const [openDialog, setOpenDialog] = useState(false);

  const { signer } = useSignerContext();

  const showSection =
    campaign.status === CampaignStatus.ACTIVE &&
    campaign.launcher === signer?.address;

  return (
    <>
      {showSection && (
        <Box component="section" width={{ xs: '100%', md: '60%' }}>
          <Typography
            component="span"
            display="inline"
            fontSize={14}
            fontWeight={500}
            lineHeight="20px"
            color="rgba(255, 255, 255, 0.6)"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
          </Typography>
          <Button
            variant="text"
            sx={{
              display: 'inline',
              ml: 0.5,
              p: 0,
              bgcolor: 'transparent',
              color: '#ff6262',
              fontSize: 14,
              fontWeight: 700,
              lineHeight: '20px',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
            onClick={() => setOpenDialog(true)}
          >
            Cancel this Campaign
          </Button>
        </Box>
      )}
      <CancelCampaignDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        campaign={campaign}
      />
    </>
  );
};

export default CancelCampaignSection;

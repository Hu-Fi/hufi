import type { FC } from 'react';

import { Box, Typography } from '@mui/material';

import type { CampaignType } from '@/types';
import { mapTypeToLabel } from '@/utils';

type Props = {
  campaignType: CampaignType;
};

const CampaignTypeLabel: FC<Props> = ({ campaignType }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={2}
      py="6px"
      bgcolor="secondary.main"
      borderRadius="4px"
    >
      <Typography variant="subtitle2" color="secondary.contrast">
        {mapTypeToLabel(campaignType)}
      </Typography>
    </Box>
  );
};

export default CampaignTypeLabel;

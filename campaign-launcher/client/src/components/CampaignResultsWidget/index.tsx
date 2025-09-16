import { FC, MouseEvent } from 'react';

import { Box, IconButton, Stack, Typography } from '@mui/material';

import { OpenInNewIcon } from '../../icons';

type Props = {
  finalResultsUrl: string | null;
  intermediateResultsUrl: string | null;
};

const handleOpenUrl = (e: MouseEvent<HTMLButtonElement>, url: string) => {
  e.stopPropagation();
  window.open(url, '_blank');
};

const STATUS = {
  none: {
    label: 'N/A',
    bgcolor: 'error.main',
  },
  intermediate: {
    label: 'Intermediate',
    bgcolor: 'warning.main',
  },
  final: {
    label: 'Final',
    bgcolor: 'success.main',
  },
}

export const StatusTooltip = () => (
  <Stack width={150} gap={0.5}>
    <Box display="flex" alignItems="baseline" gap={0.5}>
      <Box p={0.5} borderRadius="50%" bgcolor={STATUS.final.bgcolor} />
      <Typography variant="tooltip"><strong>Final:</strong>{' '}Campaign has ended. These are the final results of the campaign.</Typography>
    </Box>
    <Box display="flex" alignItems="baseline" gap={0.5}>
      <Box p={0.5} borderRadius="50%" bgcolor={STATUS.intermediate.bgcolor} />
      <Typography variant="tooltip"><strong>Intermediate:</strong>{' '}Campaign is active. Results show progress so far.</Typography>
    </Box>
    <Box display="flex" alignItems="baseline" gap={0.5}>
      <Box p={0.5} borderRadius="50%" bgcolor={STATUS.none.bgcolor} />
      <Typography variant="tooltip"><strong>N/A:</strong>{' '}Campaign is active but no results have been recorded yet.</Typography>
    </Box>
  </Stack>
);

const CampaignResultsWidget: FC<Props> = ({ finalResultsUrl, intermediateResultsUrl }) => {
  const status = finalResultsUrl ? STATUS.final : intermediateResultsUrl ? STATUS.intermediate : STATUS.none;

  return (
    <Box display="flex" alignItems="center">
      <Box p={0.5} borderRadius="50%" bgcolor={status.bgcolor} mr={1} />
      <Typography variant="h6">{status.label}</Typography>
      {status !== STATUS.none && (
        <IconButton 
          sx={{
            color: 'text.secondary',
            p: 0,
            ml: 'auto',
            '&:hover': { background: 'none' }, 
          }} 
          onClick={(e) => handleOpenUrl(e, finalResultsUrl || intermediateResultsUrl || '')}
        >
          <OpenInNewIcon />
        </IconButton>
      )}
    </Box>
  )
}

export default CampaignResultsWidget;

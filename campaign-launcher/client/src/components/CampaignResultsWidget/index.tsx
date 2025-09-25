import { FC, MouseEvent } from 'react';

import { Box, IconButton, Stack, Typography } from '@mui/material';

import { OpenInNewIcon } from '../../icons';
import { CampaignStatus } from '../../types';

type Props = {
  campaignStatus: CampaignStatus;
  finalResultsUrl: string | null;
  intermediateResultsUrl: string | null;
};

const handleOpenUrl = (e: MouseEvent<HTMLButtonElement>, url: string) => {
  e.stopPropagation();
  window.open(url, '_blank');
};

const RESULT = {
  none: {
    label: 'N/A',
    description: 'Campaign is active but no results have been recorded yet.',
    bgcolor: 'error.main',
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Campaign is active. Results show progress so far.',
    bgcolor: 'warning.main',
  },
  final: {
    label: 'Final',
    description: 'Campaign has ended. These are the final results of the campaign.',
    bgcolor: 'success.main',
  },
}

export const StatusTooltip = () => (
  <Stack width={150} gap={0.5}>
    <Box display="flex" alignItems="baseline" gap={0.5}>
      <Box p={0.5} borderRadius="50%" bgcolor={RESULT.final.bgcolor} />
      <Typography variant="tooltip"><strong>Final:</strong>{' '}{RESULT.final.description}</Typography>
    </Box>
    <Box display="flex" alignItems="baseline" gap={0.5}>
      <Box p={0.5} borderRadius="50%" bgcolor={RESULT.intermediate.bgcolor} />
      <Typography variant="tooltip"><strong>Intermediate:</strong>{' '}{RESULT.intermediate.description}</Typography>
    </Box>
    <Box display="flex" alignItems="baseline" gap={0.5}>
      <Box p={0.5} borderRadius="50%" bgcolor={RESULT.none.bgcolor} />
      <Typography variant="tooltip"><strong>N/A:</strong>{' '}{RESULT.none.description}</Typography>
    </Box>
  </Stack>
);

const CampaignResultsWidget: FC<Props> = ({ campaignStatus, finalResultsUrl, intermediateResultsUrl }) => {
  const isFinished = campaignStatus !== CampaignStatus.ACTIVE;
  const result = isFinished && finalResultsUrl ? RESULT.final : intermediateResultsUrl ? RESULT.intermediate : RESULT.none;

  return (
    <Box display="flex" alignItems="center">
      <Box p={0.5} borderRadius="50%" bgcolor={result.bgcolor} mr={1} />
      <Typography variant="h6">{result.label}</Typography>
      {result !== RESULT.none && (
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

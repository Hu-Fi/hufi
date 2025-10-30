import type { FC, MouseEvent } from 'react';

import { Box, IconButton, Stack, Typography } from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';
import { OpenInNewIcon } from '@/icons';
import { CampaignStatus } from '@/types';

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
    description: 'No results have been recorded for campaign.',
    bgcolor: 'error.main',
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Campaign is active. Results show progress so far.',
    bgcolor: 'warning.main',
  },
  final: {
    label: 'Final',
    description:
      'Campaign has ended. These are the final results of the campaign.',
    bgcolor: 'success.main',
  },
};
type ResultType = typeof RESULT;

export const StatusTooltip = () => (
  <Stack width={150} gap={0.5}>
    <Box display="flex" alignItems="baseline" gap={0.5}>
      <Box p={0.5} borderRadius="50%" bgcolor={RESULT.final.bgcolor} />
      <Typography variant="tooltip">
        <strong>Final:</strong> {RESULT.final.description}
      </Typography>
    </Box>
    <Box display="flex" alignItems="baseline" gap={0.5}>
      <Box p={0.5} borderRadius="50%" bgcolor={RESULT.intermediate.bgcolor} />
      <Typography variant="tooltip">
        <strong>Intermediate:</strong> {RESULT.intermediate.description}
      </Typography>
    </Box>
    <Box display="flex" alignItems="baseline" gap={0.5}>
      <Box p={0.5} borderRadius="50%" bgcolor={RESULT.none.bgcolor} />
      <Typography variant="tooltip">
        <strong>N/A:</strong> {RESULT.none.description}
      </Typography>
    </Box>
  </Stack>
);

const CampaignResultsWidget: FC<Props> = ({
  campaignStatus,
  finalResultsUrl,
  intermediateResultsUrl,
}) => {
  const isMobile = useIsMobile();

  const isFinished = [
    CampaignStatus.CANCELLED,
    CampaignStatus.COMPLETED,
  ].includes(campaignStatus);

  let result: ResultType[keyof ResultType];
  let resultUrl: string;

  if (isFinished && finalResultsUrl) {
    result = RESULT.final;
    resultUrl = finalResultsUrl;
  } else if (!isFinished && intermediateResultsUrl) {
    result = RESULT.intermediate;
    resultUrl = intermediateResultsUrl;
  } else {
    result = RESULT.none;
    resultUrl = '';
  }

  return (
    <Box display="flex" alignItems="center">
      <Box p={0.5} borderRadius="50%" bgcolor={result.bgcolor} mr={1} />
      <Typography
        variant={isMobile ? 'body2' : 'h6'}
        fontWeight={isMobile ? 700 : 500}
      >
        {result.label}
      </Typography>
      {result !== RESULT.none && (
        <IconButton
          sx={{
            color: 'text.secondary',
            p: 0,
            ml: 'auto',
            '&:hover': { background: 'none' },
          }}
          onClick={(e) => handleOpenUrl(e, resultUrl || '')}
        >
          <OpenInNewIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default CampaignResultsWidget;

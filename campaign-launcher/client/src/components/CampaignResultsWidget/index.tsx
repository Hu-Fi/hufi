import type { FC } from 'react';

import { Box, Link, Stack, Typography } from '@mui/material';

import { CampaignStatus } from '@/types';

type Props = {
  campaignStatus: CampaignStatus;
  finalResultsUrl: string | null;
  intermediateResultsUrl: string | null;
};

const RESULT = {
  none: {
    label: 'N/A',
    description: 'No results have been recorded for campaign.',
    bgcolor: 'error.main',
    cardBgColor: '#361034',
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Campaign is active. Results show progress so far.',
    bgcolor: 'warning.main',
    cardBgColor: 'rgba(255, 187, 0, 0.20)',
  },
  final: {
    label: 'Final',
    description:
      'Campaign has ended. These are the final results of the campaign.',
    bgcolor: 'success.main',
    cardBgColor: 'rgba(83, 255, 60, 0.15)',
  },
};

type ResultType = typeof RESULT;

const resultStyles = {
  color: 'white',
  fontSize: { xs: '20px', md: '36px' },
  fontWeight: { xs: 500, md: 800 },
  lineHeight: { xs: '150%', md: '100%' },
};

const CampaignResultsWidget: FC<Props> = ({
  campaignStatus,
  finalResultsUrl,
  intermediateResultsUrl,
}) => {
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
    <Stack
      flexDirection={{ xs: 'column-reverse', md: 'column' }}
      padding={{ xs: '12px 16px 16px', md: '28px 32px' }}
      height={{ xs: '100px', md: '175px' }}
      gap={{ xs: '16px', md: '45px' }}
      borderRadius={{ xs: '8px', md: '16px' }}
      bgcolor={result.cardBgColor}
      border="1px solid rgba(255, 255, 255, 0.1)"
    >
      <Typography
        variant="subtitle2"
        color="#a496c2"
        fontSize={{ xs: '14px', md: '16px' }}
        fontWeight={{ xs: 400, md: 600 }}
        lineHeight={{ xs: '21px', md: '18px' }}
        letterSpacing={{ xs: '0px', md: '1.5px' }}
        textTransform={{ xs: 'none', md: 'uppercase' }}
      >
        Campaign results
      </Typography>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={{ xs: 0.5, md: 1 }}>
          <Box
            width={{ xs: 8, md: 12 }}
            height={{ xs: 8, md: 12 }}
            borderRadius="50%"
            bgcolor={result.bgcolor}
          />
          {resultUrl ? (
            <Link
              href={resultUrl}
              target="_blank"
              sx={{ ...resultStyles, textDecoration: 'underline' }}
            >
              {result.label}
            </Link>
          ) : (
            <Typography sx={resultStyles}>{result.label}</Typography>
          )}
        </Box>
      </Box>
    </Stack>
  );
};

export default CampaignResultsWidget;

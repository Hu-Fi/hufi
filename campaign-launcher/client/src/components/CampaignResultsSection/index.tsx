import { type FC } from 'react';

import { Box, Link, Stack, Typography } from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';
import { OpenInNewIcon } from '@/icons';
import { CampaignStatus, type Campaign } from '@/types';

const RESULT = {
  none: {
    label: 'N/A',
    color: '#a0a0a0',
  },
  intermediate: {
    label: 'Intermediate',
    color: 'warning.main',
  },
  final: {
    label: 'Final',
    color: 'success.main',
  },
};

type ResultType = typeof RESULT;

type Props = {
  campaign: Campaign;
};

const CampaignResultsSection: FC<Props> = ({ campaign }) => {
  const isMobile = useIsMobile();
  const { final_results_url, intermediate_results_url, status } = campaign;

  const isFinished = [
    CampaignStatus.CANCELLED,
    CampaignStatus.COMPLETED,
  ].includes(status);

  const resultUrlForFinished = final_results_url ?? intermediate_results_url;

  let result: ResultType[keyof ResultType];
  let resultUrl: string;

  if (isFinished && resultUrlForFinished) {
    result = RESULT.final;
    resultUrl = resultUrlForFinished;
  } else if (!isFinished && intermediate_results_url) {
    result = RESULT.intermediate;
    resultUrl = intermediate_results_url;
  } else {
    result = RESULT.none;
    resultUrl = '';
  }

  const renderResult = () => {
    return (
      <>
        <Box
          sx={{
            p: { xs: '4px', md: '6px' },
            borderRadius: '100%',
            bgcolor: result.color,
          }}
        />
        <Typography
          sx={{
            color: result.color,
            fontSize: { xs: '14px', md: '16px' },
            fontWeight: 600,
            lineHeight: '150%',
            letterSpacing: 0,
          }}
        >
          {result.label}
        </Typography>
      </>
    );
  };

  return (
    <Stack
      component="section"
      sx={{
        py: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'center', md: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1, md: 2 },
          bgcolor: 'rgba(212, 207, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '8px',
          p: { xs: 1.5, md: 2 },
        }}
      >
        <Typography
          component="h6"
          sx={{
            color: isMobile ? '#a496c2' : 'text.primary',
            fontSize: { xs: 12, md: 16 },
            fontWeight: 600,
            lineHeight: { xs: '150%', md: '100%' },
            letterSpacing: { xs: '1.5px', md: '3.2px' },
            textTransform: 'uppercase',
          }}
        >
          Cycle Result History
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {resultUrl ? (
            <Link
              href={resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
              }}
            >
              {renderResult()}
              <OpenInNewIcon sx={{ fontSize: { xs: '14px', md: '16px' } }} />
            </Link>
          ) : (
            renderResult()
          )}
        </Box>
      </Box>
    </Stack>
  );
};

export default CampaignResultsSection;

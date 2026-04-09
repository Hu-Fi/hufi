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

  let result: ResultType[keyof ResultType];
  let resultUrl: string;

  if (isFinished && final_results_url) {
    result = RESULT.final;
    resultUrl = final_results_url;
  } else if (!isFinished && intermediate_results_url) {
    result = RESULT.intermediate;
    resultUrl = intermediate_results_url;
  } else {
    result = RESULT.none;
    resultUrl = '';
  }

  return (
    <Stack component="section" py={3}>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={{ xs: 1, md: 2 }}
      >
        <Typography
          component="h6"
          color={isMobile ? 'white' : 'text.primary'}
          fontSize={{ xs: 20, md: 16 }}
          fontWeight={{ xs: 500, md: 600 }}
          letterSpacing={{ xs: 0, md: '3.2px' }}
          textTransform={{ xs: 'none', md: 'uppercase' }}
        >
          Previous Cycles Results History
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box
            p={{ xs: '4px', md: '6px' }}
            borderRadius="100%"
            bgcolor={result.color}
          />
          <Typography
            color={result.color}
            fontSize={{ xs: '16px', md: '20px' }}
            fontWeight={{ xs: 500, md: 600 }}
            lineHeight={{ xs: '150%', md: '100%' }}
          >
            {result.label}
          </Typography>
          {!!resultUrl && (
            <Link
              href={resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <OpenInNewIcon sx={{ fontSize: { xs: '16px', md: '20px' } }} />
            </Link>
          )}
        </Box>
      </Box>
    </Stack>
  );
};

export default CampaignResultsSection;

import type { FC, PropsWithChildren } from 'react';

import { Box, Typography } from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';
import { JobsIcon } from '@/icons';

type Props = {
  title: string;
};

const PageTitle: FC<PropsWithChildren<Props>> = ({ title, children }) => {
  const isMobile = useIsMobile();

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      flexWrap={{ xs: 'wrap', md: 'nowrap' }}
    >
      <JobsIcon sx={{ width: 66, height: 66 }} />
      <Typography
        component="h1"
        variant={isMobile ? 'h6-mobile' : 'h4-mobile'}
        minWidth="fit-content"
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};

export default PageTitle;

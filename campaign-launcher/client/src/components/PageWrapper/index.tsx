import type { FC, PropsWithChildren } from 'react';

import { Paper } from '@mui/material';

import { MOBILE_BOTTOM_NAV_HEIGHT } from '@/constants';

const PageWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        pt: { xs: 4, md: 8 },
        pb: { xs: 5, md: 8 },
        px: { xs: 2, md: 0 },
        flexDirection: 'column',
        bgcolor: 'background.default',
        minHeight: {
          xs: `calc(100vh - 62px - ${MOBILE_BOTTOM_NAV_HEIGHT}px)`, // minus header and bottom nav
          md: 'calc(100vh - 91px)', // minus header
        },
      }}
    >
      {children}
    </Paper>
  );
};

export default PageWrapper;

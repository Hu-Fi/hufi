import type { FC, PropsWithChildren } from 'react';

import { Paper } from '@mui/material';

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
        minHeight: 'calc(100vh - 226px)',
      }}
    >
      {children}
    </Paper>
  );
};

export default PageWrapper;

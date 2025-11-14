import type { FC, PropsWithChildren } from 'react';

import { Paper } from '@mui/material';

const PageWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Paper
      elevation={1}
      sx={{
        display: 'flex',
        py: { xs: 2, md: 4, xl: 8 },
        px: { xs: 2, md: 4, xl: 13 },
        flexDirection: 'column',
        borderRadius: { xs: '0px', md: '20px' },
        bgcolor: 'background.default',
        minHeight: 'calc(100vh - 226px)',
        gap: { xs: 3, md: 4, xl: 7 },
      }}
    >
      {children}
    </Paper>
  );
};

export default PageWrapper;

import { FC, PropsWithChildren } from 'react';

import { Paper } from '@mui/material';

const PageWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        display: 'flex',
        py: { xs: 4, xl: 8 },
        px: { xs: 3, lg: 4, xl: 13 },
        flexDirection: 'column',
        borderRadius: '20px',
        bgcolor: 'background.default',
        minHeight: 'calc(100vh - 216px)',
        gap: { xs: 4, xl: 7},
      }}
    >
      {children}
    </Paper>
  );
};

export default PageWrapper;

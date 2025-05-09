import { FC, PropsWithChildren } from 'react';

import { Paper } from '@mui/material';

const PageWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Paper
      elevation={1}
      sx={{
        display: 'flex',
        py: 8,
        px: { xs: 3, sm: 5, md: 7, lg: 9, xl: 11, xxl: 13 },
        flexDirection: 'column',
        borderRadius: '20px',
        bgcolor: 'background.default',
        minHeight: 'calc(100vh - 216px)',
        gap: 7,
      }}
    >
      {children}
    </Paper>
  );
};

export default PageWrapper;

import { FC, PropsWithChildren } from 'react';

import { Box, Typography } from '@mui/material';

import { JobsIcon } from '../../icons';

type Props = {
  title: string;
};

const PageTitle: FC<PropsWithChildren<Props>> = ({ title, children }) => {
  return (
    <Box display="flex" alignItems="center" gap={2}>
      <JobsIcon sx={{ width: 66, height: 66 }} />
      <Typography component="h1" variant="h3">
        {title}
      </Typography>
      {children}
    </Box>
  );
};

export default PageTitle;

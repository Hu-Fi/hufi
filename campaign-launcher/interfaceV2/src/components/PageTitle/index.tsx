import { FC } from 'react';

import { Box, Typography } from '@mui/material';

import { JobsIcon } from '../../icons';

const PageTitle: FC<{ title: string }> = ({ title }) => {
  return (
    <Box display="flex" alignItems="center" gap={2}>
      <JobsIcon sx={{ width: 66, height: 66 }} />
      <Typography component="h1" variant="h3">
        {title}
      </Typography>
    </Box>
  );
};

export default PageTitle;

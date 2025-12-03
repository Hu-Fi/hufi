import { forwardRef } from 'react';

import { Box, type BoxProps, Typography } from '@mui/material';

const InfoTooltipInner = forwardRef((props: BoxProps, ref) => {
  return (
    <Box
      ref={ref}
      display="flex"
      justifyContent="center"
      alignItems="center"
      width={32}
      height={32}
      py={0.5}
      px={1.5}
      borderRadius="100%"
      sx={{
        background:
          'linear-gradient(13deg, rgba(247, 248, 253, 0.05) 20.33%, rgba(255, 255, 255, 0.05) 48.75%)',
        cursor: 'pointer',
      }}
      {...props}
    >
      <Typography
        component="span"
        variant="subtitle2"
        color="text.secondary"
        textTransform="lowercase"
      >
        i
      </Typography>
    </Box>
  );
});

export default InfoTooltipInner;

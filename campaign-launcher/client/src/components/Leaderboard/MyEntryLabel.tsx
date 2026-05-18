import { Box, Typography } from '@mui/material';

const MyEntryLabel = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 0.5,
      px: 1,
      borderRadius: '9px',
      background: 'linear-gradient(98deg, #FFF -10.24%, #FEC0D6 106.59%)',
    }}
  >
    <Typography
      variant="caption"
      sx={{
        color: '#e65d8e',
        fontWeight: 600,
        letterSpacing: 0,
        lineHeight: 1,
      }}
    >
      You
    </Typography>
  </Box>
);

export default MyEntryLabel;

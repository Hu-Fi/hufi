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
    <Typography variant="subtitle3" sx={{ color: '#e65d8e' }}>
      You
    </Typography>
  </Box>
);

export default MyEntryLabel;

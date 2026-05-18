import { Box, Button, Paper, Stack, Typography } from '@mui/material';

import { RefreshIcon, SettingsIcon } from '@/icons';

const CampaignsErrorState = ({ onRefetch }: { onRefetch: () => void }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        py: 3,
        px: 2,
        bgcolor: '#251d47',
        borderRadius: '16px',
        height: '400px',
      }}
    >
      <Stack
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          m: 'auto',
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            p: 1,
            borderRadius: '16px',
            border: '1px solid #433679',
            bgcolor: '#32295a',
          }}
        >
          <SettingsIcon sx={{ width: '100%', height: '100%' }} />
        </Box>
        <Typography
          component="p"
          variant="h6"
          sx={{
            color: 'white',
            fontWeight: 700,
          }}
        >
          Something went wrong
        </Typography>
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 500,
            color: '#a0a0a0',
            mb: 2,
          }}
        >
          We couldn&apos;t load campaigns right now. This is on our end, please
          try again in a moment.
        </Typography>
        <Button
          variant="outlined"
          size="large"
          color="primary"
          startIcon={<RefreshIcon />}
          sx={{ borderColor: '#3a2e6f' }}
          onClick={onRefetch}
        >
          Retry
        </Button>
      </Stack>
    </Paper>
  );
};

export default CampaignsErrorState;

import { Box, Button, Paper, Stack, Typography } from '@mui/material';

import { RefreshIcon, SettingsIcon } from '@/icons';

const PageErrorState = ({
  description,
  onRefetch,
}: {
  description: string;
  onRefetch: () => void;
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        py: 3,
        px: 2,
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
            bgcolor: 'background.subtle',
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'border.strong',
          }}
        >
          <SettingsIcon sx={{ width: '100%', height: '100%' }} />
        </Box>
        <Typography component="p" variant="h4" sx={{ color: 'neutral.100' }}>
          Something went wrong
        </Typography>
        <Typography variant="body3" sx={{ color: 'neutral.500', mb: 2 }}>
          {description}
        </Typography>
        <Button
          variant="outlined"
          size="large"
          startIcon={<RefreshIcon />}
          sx={{ bgcolor: 'background.paper', borderColor: 'border.strong' }}
          onClick={onRefetch}
        >
          Retry
        </Button>
      </Stack>
    </Paper>
  );
};

export default PageErrorState;

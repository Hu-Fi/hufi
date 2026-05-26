import { type FC } from 'react';

import { Box, Button, Typography } from '@mui/material';

import Container from '@/components/Container';
import { useIsMobile } from '@/hooks/useBreakpoints';

type Props = {
  onDiscardChanges: () => void;
  onSaveChanges: () => void;
  isSavingPreferences: boolean;
};

const UnsavedPreferencesBar: FC<Props> = ({
  onDiscardChanges,
  onSaveChanges,
  isSavingPreferences,
}) => {
  const isMobile = useIsMobile();

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: { xs: '120px', md: '84px' },
        py: 2.5,
        position: 'fixed',
        bottom: 0,
        left: 0,
        bgcolor: '#251d47',
        zIndex: 10,
      }}
    >
      <Container>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            px: { xs: 2, md: 0 },
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 500,
              color: '#a4a4a4',
              lineHeight: '150%',
            }}
          >
            You have{' '}
            <Typography
              component="span"
              sx={{ color: '#be9827', fontWeight: 500 }}
            >
              unsaved changes
            </Typography>
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              width: { xs: '100%', md: 'auto' },
              '& .MuiButton-root': { minWidth: { xs: 'none', md: 150 } },
            }}
          >
            <Button
              variant="outlined"
              size="large"
              fullWidth={isMobile}
              disabled={isSavingPreferences}
              sx={{
                color: 'white',
                borderColor: '#433679',
              }}
              onClick={onDiscardChanges}
            >
              Discard
            </Button>
            <Button
              variant="contained"
              size="large"
              color="error"
              fullWidth={isMobile}
              disabled={isSavingPreferences}
              onClick={onSaveChanges}
            >
              Save changes
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default UnsavedPreferencesBar;

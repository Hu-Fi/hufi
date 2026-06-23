import { type FC } from 'react';

import { Box, Button, Slide, Typography } from '@mui/material';

import Container from '@/components/Container';
import { useIsMobile } from '@/hooks/useBreakpoints';

type Props = {
  onDiscardChanges: () => void;
  onSaveChanges: () => void;
  isSavingPreferences: boolean;
  isSaveEnabled: boolean;
  isVisible: boolean;
};

const UnsavedPreferencesBar: FC<Props> = ({
  onDiscardChanges,
  onSaveChanges,
  isSavingPreferences,
  isSaveEnabled,
  isVisible,
}) => {
  const isMobile = useIsMobile();

  return (
    <Slide
      in={isVisible}
      direction="up"
      mountOnEnter
      unmountOnExit
      timeout={200}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: { xs: '120px', md: '85px' },
          py: 2.5,
          position: 'fixed',
          bottom: 0,
          left: 0,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'border.strong',
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
              variant={isMobile ? 'body1' : 'body3'}
              sx={{ color: 'text.auxiliary' }}
            >
              You have{' '}
              <Typography
                component="span"
                variant={isMobile ? 'body1' : 'body3'}
                sx={{ color: 'warning.main' }}
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
                '& .MuiButton-root': { minWidth: 150 },
              }}
            >
              <Button
                variant="outlined"
                size="large"
                fullWidth={isMobile}
                disabled={isSavingPreferences}
                sx={{
                  color: 'neutral.100',
                  borderColor: 'border.strong',
                }}
                onClick={onDiscardChanges}
              >
                Discard
              </Button>
              <Button
                variant="contained"
                size="large"
                color="accent"
                fullWidth={isMobile}
                disabled={isSavingPreferences || !isSaveEnabled}
                onClick={onSaveChanges}
              >
                Save changes
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Slide>
  );
};

export default UnsavedPreferencesBar;

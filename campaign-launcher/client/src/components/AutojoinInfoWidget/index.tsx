import { useState, type FC } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { useNavigate } from 'react-router';

import { ROUTES, SHOW_AUTOJOIN_WIDGET_KEY } from '@/constants';
import { AutojoinLabelIcon, LightningIcon } from '@/icons';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

const AutojoinInfoWidget: FC = () => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(
    localStorage.getItem(SHOW_AUTOJOIN_WIDGET_KEY) !== 'false'
  );

  const navigate = useNavigate();
  const { isAuthenticated } = useWeb3Auth();

  if (!isWidgetOpen || !isAuthenticated) return null;

  const handleCloseWidget = () => {
    localStorage.setItem(SHOW_AUTOJOIN_WIDGET_KEY, 'false');
    setIsWidgetOpen(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        background: 'linear-gradient(90deg, #251D47 0%, #3C2F73 100%)',
        gap: 10,
        mt: 2,
        mb: 8,
        px: 3.5,
        py: 4,
        borderRadius: '18px',
        border: '2px solid #342D54',
      }}
    >
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box
          sx={{
            display: 'flex',
            position: 'relative',
            width: 63,
            height: 63,
          }}
        >
          <AutojoinLabelIcon
            sx={{
              width: 63,
              height: 63,
              color: '#3d5b6e',
            }}
          />
          <LightningIcon
            sx={{
              width: 16,
              height: 16,
              position: 'absolute',
              top: 0,
              right: 4,
              color: '#43ba96',
            }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 0.5, lg: 1 },
          }}
        >
          <Typography
            sx={{
              color: 'white',
              fontSize: 20,
              fontWeight: 700,
              lineHeight: { xs: '100%', lg: '150%' },
            }}
          >
            Save time with Autojoin
          </Typography>
          <Typography
            sx={{
              color: '#a29dca',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: { xs: '100%', lg: '150%' },
              maxWidth: { xs: '450px', lg: 'none' },
            }}
          >
            Configure your preferences and let HuFi join the right campaigns on
            your behalf
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          size="large"
          sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.12)' }}
          onClick={() => navigate(ROUTES.PREFERENCES)}
        >
          Edit Preferences
        </Button>
        <IconButton
          aria-label="Close widget"
          sx={{ p: 0 }}
          disableRipple
          onClick={handleCloseWidget}
        >
          <CloseIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 24 }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default AutojoinInfoWidget;

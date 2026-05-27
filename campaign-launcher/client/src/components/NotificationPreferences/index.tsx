import { useEffect, useState, type FC } from 'react';

import TelegramIcon from '@mui/icons-material/Telegram';
import { Box, Stack, Typography } from '@mui/material';

import LinkTelegramAccountButton from '@/components/LinkTelegramAccountButton';
import { loadTelegramClient } from '@/lib/loadTelegramClient';
import { type Preferences } from '@/types';

const clientId = '8802233155';

type Props = {
  preferences: Preferences['notifications'] | null;
  isPreferencesLoading: boolean;
};

const NotificationPreferences: FC<Props> = () => {
  const [clientStatus, setClientStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading');

  useEffect(() => {
    loadTelegramClient()
      .then(() => {
        if (!window.Telegram?.Login || !clientId) {
          setClientStatus('error');
          return;
        }

        window.Telegram.Login.init({
          client_id: clientId,
        });
        setClientStatus('ready');
      })
      .catch(() => {
        setClientStatus('error');
      });
  }, []);

  const handleLinkTelegram = () => {
    if (!window.Telegram?.Login) {
      setClientStatus('error');
      return;
    }

    window.Telegram.Login.auth(
      { client_id: clientId, request_access: ['write'] },
      (result) => {
        // eslint-disable-next-line no-console
        console.log('result', result);
        if ('error' in result) {
          console.error(result.error);
          setClientStatus('error');
          return;
        }

        setClientStatus('ready');
      }
    );
  };

  return (
    <Stack
      sx={{
        width: '100%',
        minHeight: '290px',
        bgcolor: '#251d47',
        borderRadius: '18px',
        borderTop: '1px solid #3a2e6f',
        '& > :not(:last-child)': {
          borderBottom: '1px solid #342d54',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 5, gap: 3.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '16px',
            bgcolor: '#53a6e4',
          }}
        >
          <TelegramIcon sx={{ fontSize: 32, color: 'white' }} />
        </Box>
        <Stack sx={{ gap: 1 }}>
          <Typography
            sx={{
              color: 'white',
              fontSize: 20,
              fontWeight: 700,
              lineHeight: '100%',
            }}
          >
            Telegram Alerts
          </Typography>
          <Typography
            sx={{
              color: '#a29dca',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: '100%',
            }}
          >
            Get Telegram updates on HuFi activity.
          </Typography>
        </Stack>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 5,
          gap: 3.5,
        }}
      >
        <Stack sx={{ gap: 2.5 }}>
          <Typography
            sx={{
              color: 'white',
              fontSize: 20,
              fontWeight: 500,
              lineHeight: '100%',
            }}
          >
            Telegram Account
          </Typography>
          <Typography
            sx={{
              color: '#b98c08',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: '100%',
            }}
          >
            Not linked
          </Typography>
        </Stack>
        <LinkTelegramAccountButton
          isClientReady={clientStatus === 'ready'}
          isLinked={false}
          onLink={handleLinkTelegram}
        />
      </Box>
    </Stack>
  );
};

export default NotificationPreferences;

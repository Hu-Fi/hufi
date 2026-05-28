import { type ChangeEvent, useEffect, useState, type FC } from 'react';

import TelegramIcon from '@mui/icons-material/Telegram';
import {
  Box,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

import { SwitchStyled } from '@/components/AutojoinPreferences/components';
import TelegramAccountLinkButton from '@/components/TelegramAccountLinkButton';
import { useNotification } from '@/hooks/useNotification';
import { LinkOffIcon, LinkOnIcon } from '@/icons';
import { loadTelegramLoginClient } from '@/lib/loadTelegramClient';
import { type Preferences } from '@/types';

const clientId = import.meta.env.VITE_HUFI_TG_BOT_CLIENT_ID;
const CLIENT_ERROR_MESSAGE =
  'Telegram unavailable right now. Please try again later.';
const POPUP_CLOSED_ERROR = 'popup_closed';

type Props = {
  preferences: Preferences['notifications'] | null;
  onSectionChange: (
    section: 'notifications',
    value: Preferences['notifications']
  ) => void;
  isPreferencesLoading: boolean;
  isSavingPreferences: boolean;
};

enum ClientStatus {
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}

const NotificationPreferences: FC<Props> = ({
  preferences,
  onSectionChange,
  isPreferencesLoading,
  isSavingPreferences,
}) => {
  const [clientStatus, setClientStatus] = useState<ClientStatus>(
    ClientStatus.LOADING
  );
  const [isLinking, setIsLinking] = useState(false);

  const { showError, showWarning } = useNotification();

  const isLinked = !!preferences?.telegram_user_id;

  useEffect(() => {
    loadTelegramLoginClient()
      .then(() => {
        if (!clientId || !window.Telegram?.Login) {
          setClientStatus(ClientStatus.ERROR);
          showError(CLIENT_ERROR_MESSAGE);
          return;
        }

        setClientStatus(ClientStatus.READY);
      })
      .catch(() => {
        setClientStatus(ClientStatus.ERROR);
        showError(CLIENT_ERROR_MESSAGE);
      });
  }, [showError]);

  const handleLinkTelegram = () => {
    if (!window.Telegram?.Login) {
      showError(CLIENT_ERROR_MESSAGE);
      return;
    }

    if (!preferences) return null;

    setIsLinking(true);

    window.Telegram.Login.auth(
      { client_id: clientId, request_access: ['write'] },
      (result) => {
        if ('error' in result) {
          console.error(result.error);
          if (result.error === POPUP_CLOSED_ERROR) {
            showWarning('Popup closed');
          } else {
            showError('Failed to link Telegram account. Please try again.');
          }
        } else {
          onSectionChange('notifications', {
            ...preferences,
            telegram_user_id: result.user.id as string,
          });
        }
        setIsLinking(false);
      }
    );
  };

  const handleUnlinkTelegram = () => {
    if (!preferences) return null;

    onSectionChange('notifications', {
      ...preferences,
      campaigns_autojoin: false,
      telegram_user_id: null,
    });
  };

  const handleSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!preferences) return null;

    onSectionChange('notifications', {
      ...preferences,
      campaigns_autojoin: event.target.checked,
    });
  };

  const renderAccountStatus = () => {
    if (isLinked) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#43ba96',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: '100%',
            }}
          >
            <LinkOnIcon sx={{ fontSize: 24 }} />
            Linked
          </Typography>
          <Typography
            sx={{
              color: 'rgba(212, 207, 255, 0.70)',
              fontSize: 16,
              lineHeight: '100%',
            }}
          >
            id: {preferences?.telegram_user_id}
          </Typography>
        </Box>
      );
    } else if (!isLinked && !isLinking) {
      return (
        <Typography
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#b98c08',
            fontSize: 16,
            fontWeight: 500,
            lineHeight: '100%',
          }}
        >
          <LinkOffIcon sx={{ fontSize: 24 }} />
          Not linked
        </Typography>
      );
    } else {
      return (
        <Typography
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#a29dca',
            fontSize: 16,
            fontWeight: 500,
            lineHeight: '100%',
          }}
        >
          <CircularProgress size={24} sx={{ color: '#a29dca' }} />
          Waiting for Telegram&hellip;
        </Typography>
      );
    }
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
          {isPreferencesLoading || clientStatus === ClientStatus.LOADING ? (
            <Skeleton
              variant="text"
              width="150px"
              height={24}
              sx={{ borderRadius: '8px' }}
            />
          ) : (
            renderAccountStatus()
          )}
        </Stack>
        {isPreferencesLoading || clientStatus === ClientStatus.LOADING ? (
          <Skeleton
            variant="rectangular"
            width={150}
            height={44}
            sx={{ borderRadius: '8px' }}
          />
        ) : (
          <TelegramAccountLinkButton
            isLinked={isLinked}
            isDisabled={
              isSavingPreferences ||
              clientStatus === ClientStatus.ERROR ||
              isLinking
            }
            onLink={handleLinkTelegram}
            onUnlink={handleUnlinkTelegram}
          />
        )}
      </Box>
      <Box
        sx={{
          display: isLinked ? 'flex' : 'none',
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
            Autojoin notifications
          </Typography>
          <Typography
            sx={{
              color: '#a29dca',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: '100%',
            }}
          >
            Send a message when a campaign is auto-joined
          </Typography>
        </Stack>
        <SwitchStyled
          checked={preferences?.campaigns_autojoin ?? false}
          disabled={isSavingPreferences}
          onChange={handleSwitchChange}
        />
      </Box>
    </Stack>
  );
};

export default NotificationPreferences;

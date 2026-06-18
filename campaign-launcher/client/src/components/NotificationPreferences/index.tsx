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
import {
  useLinkTelegramAccount,
  useUnlinkTelegramAccount,
} from '@/hooks/recording-oracle/user';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useNotification } from '@/hooks/useNotification';
import { LinkOffIcon, LinkOnIcon } from '@/icons';
import { loadTelegramLoginClient } from '@/lib/loadTelegramClient';
import { type UserPreferences } from '@/types';

const clientId = import.meta.env.VITE_HUFI_TG_BOT_CLIENT_ID;
const CLIENT_ERROR_MESSAGE =
  'Telegram unavailable right now. Please try again later.';
const POPUP_CLOSED_ERROR = 'popup_closed';

type Props = {
  preferences: UserPreferences['notifications'] | null;
  telegramUserId: string | null;
  onSectionChange: (
    section: 'notifications' | 'telegram_user_id',
    value: UserPreferences['notifications' | 'telegram_user_id']
  ) => void;
  onUnlinkTelegram: () => void;
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
  telegramUserId,
  onSectionChange,
  onUnlinkTelegram,
  isPreferencesLoading,
  isSavingPreferences,
}) => {
  const [clientStatus, setClientStatus] = useState<ClientStatus>(
    ClientStatus.LOADING
  );
  const [isLinking, setIsLinking] = useState(false);

  const { showError, showWarning } = useNotification();
  const isMobile = useIsMobile();

  const { mutateAsync: linkTelegram } = useLinkTelegramAccount();
  const { mutateAsync: unlinkTelegram, isPending: isUnlinkingTelegram } =
    useUnlinkTelegramAccount();

  const isLinked = !!telegramUserId;

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
      async (result) => {
        if ('error' in result) {
          console.error(result.error);
          if (result.error === POPUP_CLOSED_ERROR) {
            showWarning('Popup closed');
          } else {
            showError('Failed to link Telegram account. Please try again.');
          }
        } else {
          try {
            const telegramUserId = await linkTelegram(result.id_token);
            onSectionChange('telegram_user_id', telegramUserId);
          } catch (error) {
            console.error(error);
            showError('Failed to link Telegram account. Please try again.');
          }
        }
        setIsLinking(false);
      }
    );
  };

  const handleUnlinkTelegram = async () => {
    if (!preferences) return null;

    try {
      await unlinkTelegram();
      onSectionChange('telegram_user_id', null);
      onUnlinkTelegram();
    } catch (error) {
      console.error(error);
      showError('Failed to unlink Telegram account. Please try again.');
    }
  };

  const handleSwitchChange = (
    event: ChangeEvent<HTMLInputElement>,
    field: keyof UserPreferences['notifications']
  ) => {
    if (!preferences) return null;

    onSectionChange('notifications', {
      ...preferences,
      [field]: event.target.checked,
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
              color: 'neutral.200',
              fontSize: { xs: 12, md: 16 },
              fontWeight: 500,
              lineHeight: '100%',
            }}
          >
            <LinkOnIcon sx={{ fontSize: { xs: 18, md: 24 } }} />
            Linked
          </Typography>
          <Typography
            sx={{
              color: 'rgba(212, 207, 255, 0.70)',
              fontSize: { xs: 12, md: 16 },
              lineHeight: '100%',
            }}
          >
            id: {telegramUserId}
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
            color: 'neutral.300',
            fontSize: { xs: 12, md: 16 },
            fontWeight: 500,
            lineHeight: '100%',
          }}
        >
          <LinkOffIcon sx={{ fontSize: { xs: 18, md: 24 } }} />
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
            color: 'secondary.400',
            fontSize: { xs: 12, md: 16 },
            fontWeight: 500,
            lineHeight: '100%',
          }}
        >
          <CircularProgress
            size={isMobile ? 18 : 24}
            sx={{ color: 'secondary.400' }}
          />
          Waiting for Telegram&hellip;
        </Typography>
      );
    }
  };

  return (
    <Stack
      sx={{
        width: '100%',
        minHeight: { xs: 'auto', md: '290px' },
        bgcolor: 'primary.200',
        borderRadius: '18px',
        borderTop: '1px solid',
        borderColor: 'border.strong',
        '& > :not(:last-child)': {
          borderBottom: '1px solid',
          borderColor: 'border.strong',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2, md: 5 },
          py: { xs: 2.5, md: 5 },
          gap: { xs: 1.5, md: 3.5 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: { xs: 48, md: 64 },
            height: { xs: 48, md: 64 },
            borderRadius: { xs: '12px', md: '16px' },
            bgcolor: '#53a6e4',
          }}
        >
          <TelegramIcon
            sx={{ fontSize: { xs: 24, md: 32 }, color: 'neutral.100' }}
          />
        </Box>
        <Stack sx={{ gap: { xs: 0.5, md: 1 } }}>
          <Typography
            sx={{
              color: 'neutral.100',
              fontSize: { xs: 16, md: 20 },
              fontWeight: 700,
              lineHeight: '100%',
            }}
          >
            Telegram Alerts
          </Typography>
          <Typography
            sx={{
              color: 'secondary.400',
              fontSize: { xs: 12, md: 16 },
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
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          px: { xs: 2, md: 5 },
          py: { xs: 2.5, md: 5 },
          gap: 3,
        }}
      >
        <Stack sx={{ gap: { xs: 1.5, md: 2.5 } }}>
          <Typography
            sx={{
              color: 'neutral.100',
              fontSize: { xs: 16, md: 20 },
              fontWeight: { xs: 700, md: 500 },
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
              isLinking ||
              isUnlinkingTelegram
            }
            onLink={handleLinkTelegram}
            onUnlink={handleUnlinkTelegram}
          />
        )}
      </Box>
      {isLinked && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, md: 5 },
            py: { xs: 2.5, md: 3.5 },
            gap: 3,
          }}
        >
          <Stack sx={{ gap: { xs: 0.5, md: 2.5 } }}>
            <Typography
              sx={{
                color: 'neutral.100',
                fontSize: { xs: 16, md: 20 },
                fontWeight: { xs: 700, md: 500 },
                lineHeight: '100%',
              }}
            >
              Autojoin notifications
            </Typography>
            <Typography
              sx={{
                color: 'secondary.400',
                fontSize: { xs: 12, md: 16 },
                fontWeight: 500,
                lineHeight: '100%',
              }}
            >
              Send a message when a campaign is auto-joined
            </Typography>
          </Stack>
          <SwitchStyled
            checked={preferences?.campaigns_autojoin ?? false}
            disabled={isSavingPreferences || isUnlinkingTelegram}
            onChange={(event) =>
              handleSwitchChange(event, 'campaigns_autojoin')
            }
          />
        </Box>
      )}
    </Stack>
  );
};

export default NotificationPreferences;

import { type FC } from 'react';

import TelegramIcon from '@mui/icons-material/Telegram';
import { Button } from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';
import { ConnectWalletIcon } from '@/icons';

type Props = {
  isLinked: boolean;
  isDisabled: boolean;
  onLink: () => void;
  onUnlink: () => void;
};

const TelegramAccountLinkButton: FC<Props> = ({
  isLinked,
  isDisabled,
  onLink,
  onUnlink,
}) => {
  const isMobile = useIsMobile();

  if (isLinked) {
    return (
      <Button
        variant="outlined"
        size="large"
        disabled={isDisabled}
        fullWidth={isMobile}
        sx={{ color: 'white', borderColor: '#433679', gap: 1 }}
        onClick={onUnlink}
      >
        <ConnectWalletIcon sx={{ fontSize: 20, fill: 'none' }} />
        Unlink account
      </Button>
    );
  }

  return (
    <Button
      variant="outlined"
      size="large"
      disabled={isDisabled}
      fullWidth={isMobile}
      sx={{ color: 'white', borderColor: '#433679', gap: 1 }}
      onClick={onLink}
    >
      <TelegramIcon sx={{ fontSize: 20 }} />
      Link account
    </Button>
  );
};

export default TelegramAccountLinkButton;

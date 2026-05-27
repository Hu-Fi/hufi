import { type FC } from 'react';

import TelegramIcon from '@mui/icons-material/Telegram';
import { Button } from '@mui/material';

import { ConnectWalletIcon } from '@/icons';

type Props = {
  isClientReady: boolean;
  isLinked: boolean;
  onLink: () => void;
};

const LinkTelegramAccountButton: FC<Props> = ({
  isClientReady,
  isLinked,
  onLink,
}) => {
  if (!isClientReady) {
    return null;
  }

  if (isLinked) {
    return (
      <Button
        variant="outlined"
        size="large"
        sx={{ color: 'white', borderColor: '#433679', gap: 1 }}
      >
        <ConnectWalletIcon sx={{ fill: 'none', fontSize: 20 }} />
        Unlink account
      </Button>
    );
  }

  return (
    <Button
      variant="outlined"
      size="large"
      sx={{ color: 'white', borderColor: '#433679', gap: 1 }}
      onClick={onLink}
    >
      <TelegramIcon sx={{ fontSize: 20, color: 'white' }} />
      Link account
    </Button>
  );
};

export default LinkTelegramAccountButton;

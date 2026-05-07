import { type FC } from 'react';

import { Button, type ButtonProps } from '@mui/material';

import { useConnectWalletModal } from '@/hooks/useConnectWalletModal';
import { ConnectWalletIcon } from '@/icons';

import ConnectWalletModal from './ConnectWalletModal';

type ConnectWalletProps = {
  size?: ButtonProps['size'];
};

const ConnectWallet: FC<ConnectWalletProps> = ({ size = 'large' }) => {
  const {
    closeConnectWallet,
    isConnecting,
    isConnectWalletOpen,
    openConnectWallet,
  } = useConnectWalletModal();

  return (
    <>
      <Button
        variant="contained"
        size={size}
        color="error"
        disabled={isConnecting}
        onClick={openConnectWallet}
        sx={{
          color: 'white',
          width: 'fit-content',
          fontSize: 12,
          gap: 1,
        }}
      >
        <ConnectWalletIcon sx={{ fill: 'none', width: 18, height: 18 }} />
        Connect Wallet
      </Button>
      <ConnectWalletModal
        open={isConnectWalletOpen}
        onClose={closeConnectWallet}
      />
    </>
  );
};

export default ConnectWallet;

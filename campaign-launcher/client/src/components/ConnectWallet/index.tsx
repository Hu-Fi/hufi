import { type FC } from 'react';

import { Button, type ButtonProps } from '@mui/material';

import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { useConnectWalletModal } from '@/hooks/useConnectWalletModal';
import { ConnectWalletIcon } from '@/icons';

import ConnectWalletContent from './ConnectWalletContent';

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
        color="accent"
        disabled={isConnecting}
        onClick={openConnectWallet}
        sx={{
          width: 'fit-content',
          fontSize: 12,
          gap: 1,
        }}
      >
        <ConnectWalletIcon sx={{ fill: 'none', width: 18, height: 18 }} />
        Connect Wallet
      </Button>
      <ResponsiveOverlay
        open={isConnectWalletOpen}
        onClose={closeConnectWallet}
        desktopSx={{
          width: 640,
          height: 600,
          maxHeight: 'calc(100dvh - 48px)',
          px: 4,
          py: 4,
        }}
        mobileSx={{ minHeight: '450px', maxHeight: '550px', p: 2 }}
        closeButtonSx={{ top: { xs: 16, md: 32 }, right: { xs: 16, md: 32 } }}
      >
        <ConnectWalletContent />
      </ResponsiveOverlay>
    </>
  );
};

export default ConnectWallet;

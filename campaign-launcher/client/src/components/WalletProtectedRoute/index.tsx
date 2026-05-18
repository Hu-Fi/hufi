import { type FC, type PropsWithChildren } from 'react';

import { Box, CircularProgress } from '@mui/material';
import { Navigate } from 'react-router';
import { useConnection } from 'wagmi';

import { ROUTES } from '@/constants';

const WalletProtectedRoute: FC<PropsWithChildren> = ({ children }) => {
  const { isConnected, isConnecting } = useConnection();

  if (isConnecting) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          height: 'calc(100vh - 91px)',
          mx: 'auto',
        }}
      >
        <CircularProgress size={100} />
      </Box>
    );
  }

  if (!isConnected && !isConnecting) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

export default WalletProtectedRoute;

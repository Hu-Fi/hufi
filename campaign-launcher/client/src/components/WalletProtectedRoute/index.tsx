import { type FC, type PropsWithChildren } from 'react';

import { Navigate } from 'react-router';
import { useConnection } from 'wagmi';

import { ROUTES } from '@/constants';

const WalletProtectedRoute: FC<PropsWithChildren> = ({ children }) => {
  const { isConnected, isConnecting } = useConnection();

  if (!isConnected && !isConnecting) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

export default WalletProtectedRoute;

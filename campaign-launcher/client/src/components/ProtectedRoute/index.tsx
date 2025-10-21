import type { FC, ReactNode } from 'react';

import { Navigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { ROUTES } from '@/constants';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { isConnected } = useAccount();
  const { isAuthenticated, isLoading } = useWeb3Auth();

  if (!isLoading && (!isConnected || !isAuthenticated)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

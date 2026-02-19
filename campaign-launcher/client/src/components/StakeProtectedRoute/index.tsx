import type { FC, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { Box, CircularProgress } from '@mui/material';
import { Navigate } from 'react-router';
import { useConnection } from 'wagmi';

import { ROUTES } from '@/constants';
import { useStakeContext } from '@/providers/StakeProvider';

interface StakeProtectedRouteProps {
  children: ReactNode;
}

enum StakeStatus {
  CHECKING = 'checking',
  HAS_STAKE = 'has-stake',
  NO_STAKE = 'no-stake',
  NO_SIGNER = 'no-signer',
}

const StakeProtectedRoute: FC<StakeProtectedRouteProps> = ({ children }) => {
  const [stakeStatus, setStakeStatus] = useState<StakeStatus>(
    StakeStatus.CHECKING
  );

  const { isConnected, isConnecting } = useConnection();
  const { fetchStakingData, isStakingClientReady } = useStakeContext();

  useEffect(() => {
    const checkStake = async () => {
      if (!isConnected && !isConnecting) {
        setStakeStatus(StakeStatus.NO_SIGNER);
        return;
      }

      if (isStakingClientReady) {
        try {
          const amount = Number(await fetchStakingData());
          setStakeStatus(
            amount > 0 ? StakeStatus.HAS_STAKE : StakeStatus.NO_STAKE
          );
        } catch {
          setStakeStatus(StakeStatus.NO_STAKE);
        }
      }
    };

    checkStake();
  }, [isConnected, isConnecting, fetchStakingData, isStakingClientReady]);

  if (stakeStatus === StakeStatus.CHECKING) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        height="calc(100vh - 90px)"
        mx="auto"
      >
        <CircularProgress size={100} />
      </Box>
    );
  }

  if (
    stakeStatus === StakeStatus.NO_SIGNER ||
    stakeStatus === StakeStatus.NO_STAKE
  ) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

export default StakeProtectedRoute;

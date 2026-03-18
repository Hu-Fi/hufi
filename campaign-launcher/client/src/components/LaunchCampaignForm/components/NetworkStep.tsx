import {
  type RefObject,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FC,
  type SetStateAction,
} from 'react';

import { StakingClient, type ChainId } from '@human-protocol/sdk';
import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';
import { ArrowLeftIcon, RefreshIcon, WarningIcon } from '@/icons';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useNetwork } from '@/providers/NetworkProvider';
import { useSignerContext } from '@/providers/SignerProvider';
import { config as wagmiConfig } from '@/providers/WagmiProvider';
import { getChainIcon } from '@/utils';

import BottomNavigation from './BottomNavigation';

const STAKING_DASHBOARD_URL = import.meta.env.VITE_APP_STAKING_DASHBOARD_URL;

const NotStakedWarning: FC<{
  handleRefresh: () => void;
  warningRef: RefObject<HTMLDivElement | null>;
}> = ({ handleRefresh, warningRef }) => {
  return (
    <Stack
      ref={warningRef}
      gap={1.5}
      p={1.5}
      mt={{ xs: 10, md: 0 }}
      bgcolor="rgba(255, 187, 0, 0.15)"
      borderRadius="4px"
      boxShadow="10px 12px 30px 0 rgba(0, 0, 0, 0.20)"
    >
      <Typography
        display="flex"
        alignItems="center"
        gap={1.5}
        variant="body1"
        fontWeight={600}
        color="#b98c08"
      >
        <WarningIcon />
        No HMT staked on this network
      </Typography>
      <Typography variant="body2" color="white" fontWeight={500}>
        To continue, please stake HMT on the selected network. Once updated try
        refreshing to apply the changes
      </Typography>
      <Box display="flex" alignItems="center" gap={1.5}>
        <Button
          variant="outlined"
          size="large"
          onClick={() =>
            window.open(STAKING_DASHBOARD_URL, '_blank', 'noopener,noreferrer')
          }
          sx={{ color: 'white', borderColor: 'white', gap: 1.5 }}
        >
          Stake HMT
          <ArrowLeftIcon sx={{ transform: 'rotate(135deg)' }} />
        </Button>
        <Button
          variant="text"
          size="large"
          onClick={handleRefresh}
          sx={{ color: 'white', gap: 1.5 }}
        >
          <RefreshIcon sx={{ fontSize: '20px' }} />
          Refresh
        </Button>
      </Box>
    </Stack>
  );
};

type Props = {
  chainId: ChainId | null;
  handleSetNetwork: (network: ChainId) => void;
  handleChangeStep: Dispatch<SetStateAction<number>>;
};

const NetworkStep: FC<Props> = ({
  chainId,
  handleChangeStep,
  handleSetNetwork,
}) => {
  const [isCheckingStake, setIsCheckingStake] = useState(false);
  const [showNotStakedWarning, setShowNotStakedWarning] = useState(false);
  const warningRef = useRef<HTMLDivElement>(null);

  const networks = wagmiConfig.chains.map((chain) => ({
    value: chain.id,
    label: chain.name,
  }));
  const { setAppChainId } = useNetwork();
  const { signer, isSignerReady } = useSignerContext();
  const { activeAddress } = useActiveAccount();
  const isMobile = useIsMobile();

  const handleClickOnNetwork = (chainId: ChainId) => {
    handleSetNetwork(chainId);
    setShowNotStakedWarning(false);
  };

  const handleNextClick = async (chainId: ChainId) => {
    if (isCheckingStake) return;
    setAppChainId(chainId);
    setIsCheckingStake(true);
  };

  useEffect(() => {
    if (isCheckingStake && isSignerReady && signer && activeAddress) {
      (async () => {
        try {
          const stakingClient = await StakingClient.build(signer);
          const stakedAmount = await stakingClient.getStakerInfo(activeAddress);
          if (Number(stakedAmount.stakedAmount) > 0) {
            handleChangeStep((prev) => prev + 1);
          } else {
            setShowNotStakedWarning(true);
          }
        } catch (error) {
          console.error('Error checking stake: ', error);
          setShowNotStakedWarning(true);
        } finally {
          setIsCheckingStake(false);
        }
      })();
    }
  }, [isCheckingStake, activeAddress, isSignerReady, signer, handleChangeStep]);

  useEffect(() => {
    if (isMobile && showNotStakedWarning && warningRef.current) {
      warningRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isMobile, showNotStakedWarning]);

  return (
    <>
      <Stack mt={4} width="100%" gridArea="main">
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {networks.map(({ value, label }) => {
            const isSelected = chainId === value;
            return (
              <Grid size={{ xs: 6, md: 4 }} key={value}>
                <Paper
                  elevation={0}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: { xs: 130, md: 160 },
                    py: 3,
                    px: 3,
                    gap: 2,
                    borderRadius: '12px',
                    bgcolor: '#251d47',
                    border: '1px solid',
                    borderColor: isSelected ? 'error.main' : '#433679',
                    cursor: 'pointer',
                    '& > svg': { fontSize: '44px' },
                  }}
                  onClick={() => handleClickOnNetwork(value)}
                >
                  {getChainIcon(value)}
                  <Typography variant="body1" color="white" fontWeight={500}>
                    {label}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
        {isMobile && showNotStakedWarning && (
          <NotStakedWarning
            warningRef={warningRef}
            handleRefresh={() => setIsCheckingStake(true)}
          />
        )}
      </Stack>
      <BottomNavigation
        handleNextClick={() => chainId && handleNextClick(chainId)}
        disableNextButton={!chainId || isCheckingStake}
      >
        {!isMobile && showNotStakedWarning && (
          <NotStakedWarning
            warningRef={warningRef}
            handleRefresh={() => setIsCheckingStake(true)}
          />
        )}
      </BottomNavigation>
    </>
  );
};

export default NetworkStep;

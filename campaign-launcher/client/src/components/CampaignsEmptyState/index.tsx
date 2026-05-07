import type { FC } from 'react';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';

import ConnectWallet from '@/components/ConnectWallet';
import LaunchCampaignButton from '@/components/LaunchCampaignButton';
import { useNotification } from '@/hooks/useNotification';
import { BigFilterIcon, CampaignIcon, LockIcon } from '@/icons';
import { useSignerContext } from '@/providers/SignerProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

type Props = {
  view: 'all' | 'joined' | 'hosted';
  hasActiveFilters: boolean;
};

type ChildProps = {
  hasActiveFilters: boolean;
};

const NO_CAMPAIGNS_MATCH_FILTERS_TITLE = 'No campaigns match your filters';
const NO_CAMPAIGNS_MATCH_FILTERS_DESCRIPTION =
  "None of the campaigns fit the filters you've applied. Try adjusting or clearing them to see more results.";

const AllCampaignsEmptyState: FC<ChildProps> = ({ hasActiveFilters }) => {
  let title;
  let description;

  if (hasActiveFilters) {
    title = NO_CAMPAIGNS_MATCH_FILTERS_TITLE;
    description = NO_CAMPAIGNS_MATCH_FILTERS_DESCRIPTION;
  } else {
    title = 'No campaigns on this network';
    description =
      'There are currently no active campaigns on the selected network. Check back soon or launch your own to get started.';
  }

  return (
    <Stack
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        m: 'auto',
        maxWidth: '500px',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '72px',
          height: '72px',
          p: 1,
          borderRadius: '16px',
          border: '1px solid #433679',
          bgcolor: '#32295a',
        }}
      >
        {hasActiveFilters ? (
          <BigFilterIcon sx={{ width: '100%', height: '100%' }} />
        ) : (
          <CampaignIcon sx={{ width: '100%', height: '100%' }} />
        )}
      </Box>
      <Typography
        component="p"
        variant="h6"
        sx={{
          color: 'white',
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: 16,
          fontWeight: 500,
          color: '#a0a0a0',
        }}
      >
        {description}
      </Typography>
    </Stack>
  );
};

const JoinedCampaignsEmptyState: FC<ChildProps> = ({ hasActiveFilters }) => {
  const { isAuthenticated, signIn } = useWeb3Auth();
  const { isSignerReady } = useSignerContext();
  const { showError } = useNotification();

  let title;
  let description;

  if (isAuthenticated) {
    if (hasActiveFilters) {
      title = NO_CAMPAIGNS_MATCH_FILTERS_TITLE;
      description = NO_CAMPAIGNS_MATCH_FILTERS_DESCRIPTION;
    } else {
      title = "You haven't joined any campaigns";
      description =
        'Campaigns you join will appear here. Browse active campaigns and jump in to start earning rewards.';
    }
  } else {
    title = 'Sign in to see your joined campaigns';
    description =
      "Connect your wallet and/or sign in to view the campaigns you've joined. Your activity is linked to your wallet address.";
  }

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch {
      showError('Failed to sign in. Please try again.');
    }
  };

  return (
    <Stack
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        m: 'auto',
        maxWidth: '500px',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '72px',
          height: '72px',
          p: 1,
          borderRadius: '16px',
          border: '1px solid #433679',
          bgcolor: '#32295a',
        }}
      >
        {!isAuthenticated && (
          <LockIcon sx={{ width: '100%', height: '100%' }} />
        )}
        {isAuthenticated && hasActiveFilters && (
          <BigFilterIcon sx={{ width: '100%', height: '100%' }} />
        )}
        {isAuthenticated && !hasActiveFilters && (
          <CampaignIcon sx={{ width: '100%', height: '100%' }} />
        )}
      </Box>
      <Typography
        component="p"
        variant="h6"
        sx={{
          color: 'white',
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: 16,
          fontWeight: 500,
          color: '#a0a0a0',
          mb: 2,
        }}
      >
        {description}
      </Typography>
      {!isSignerReady && <ConnectWallet />}
      {isSignerReady && !isAuthenticated && (
        <Button
          variant="contained"
          size="large"
          color="error"
          onClick={handleSignIn}
        >
          Sign In
        </Button>
      )}
    </Stack>
  );
};

const HostedCampaignsEmptyState: FC<ChildProps> = ({ hasActiveFilters }) => {
  const { isSignerReady } = useSignerContext();

  let title;
  let description;

  if (isSignerReady) {
    if (hasActiveFilters) {
      title = NO_CAMPAIGNS_MATCH_FILTERS_TITLE;
      description = NO_CAMPAIGNS_MATCH_FILTERS_DESCRIPTION;
    } else {
      title = "You haven't hosted any campaigns";
      description = 'Launch your campaign now!';
    }
  } else {
    title = 'Connect your wallet to see the hosted campaigns';
    description =
      'Campaigns you host are tied to your wallet address. Connect a wallet to view and manage your hosted campaigns.';
  }

  return (
    <Stack
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        m: 'auto',
        maxWidth: '500px',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '72px',
          height: '72px',
          p: 1,
          borderRadius: '16px',
          border: '1px solid #433679',
          bgcolor: '#32295a',
        }}
      >
        {!isSignerReady && <LockIcon sx={{ width: '100%', height: '100%' }} />}
        {isSignerReady && hasActiveFilters && (
          <BigFilterIcon sx={{ width: '100%', height: '100%' }} />
        )}
        {isSignerReady && !hasActiveFilters && (
          <CampaignIcon sx={{ width: '100%', height: '100%' }} />
        )}
      </Box>
      <Typography
        component="p"
        variant="h6"
        sx={{
          color: 'white',
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: 16,
          fontWeight: 500,
          color: '#a0a0a0',
          mb: 2,
        }}
      >
        {description}
      </Typography>
      {isSignerReady ? (
        <LaunchCampaignButton size="large" />
      ) : (
        <ConnectWallet />
      )}
    </Stack>
  );
};

const CampaignsEmptyState: FC<Props> = ({ view, hasActiveFilters }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        py: 3,
        px: 2,
        bgcolor: '#251d47',
        borderRadius: '16px',
        height: '400px',
      }}
    >
      {view === 'all' && (
        <AllCampaignsEmptyState hasActiveFilters={hasActiveFilters} />
      )}
      {view === 'joined' && (
        <JoinedCampaignsEmptyState hasActiveFilters={hasActiveFilters} />
      )}
      {view === 'hosted' && (
        <HostedCampaignsEmptyState hasActiveFilters={hasActiveFilters} />
      )}
    </Paper>
  );
};

export default CampaignsEmptyState;

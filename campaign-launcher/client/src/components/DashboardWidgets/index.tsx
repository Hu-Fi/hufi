import { type FC } from 'react';

import { Grid, Skeleton, styled, type Theme, Typography } from '@mui/material';
import { useConnection } from 'wagmi';

import ConnectWallet from '@/components/ConnectWallet';
import FormattedNumber from '@/components/FormattedNumber';
import LaunchCampaignButton from '@/components/LaunchCampaignButton';
import { useGetTotalVolume } from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useGetCampaignsStats } from '@/hooks/useCampaigns';
import { LinkIcon } from '@/icons';

type CardProps = {
  isReverse?: boolean;
};

const Card = styled('div', {
  shouldForwardProp: (prop) => prop !== 'isReverse',
})<CardProps>(({ theme, isReverse }: { theme: Theme } & CardProps) => ({
  display: 'flex',
  flexDirection: isReverse ? 'column-reverse' : 'column',
  height: 'stretch',
  backgroundColor: '#251d47',
  borderRadius: '16px',
  border: '1px solid',
  borderColor: 'rgba(255, 255, 255, 0.07)',
  padding: '24px 32px',

  [theme.breakpoints.down('md')]: {
    justifyContent: 'flex-end',
    padding: '12px 16px 16px',
    borderRadius: '8px',
    borderColor: '#433679',
  },
}));

const CardTitle = styled('p')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#6b6490',
  marginTop: 0,
  marginBottom: '4px',
  fontSize: '16px',
  fontWeight: 600,
  lineHeight: '18px',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',

  [theme.breakpoints.down('md')]: {
    alignItems: 'flex-start',
    marginBottom: '0px',
    fontWeight: 400,
    letterSpacing: '0.15px',
    lineHeight: '24px',
    textTransform: 'none',
  },
}));

const DashboardWidgets: FC = () => {
  const { isConnected } = useConnection();
  const isMobile = useIsMobile();

  const { data: campaignsStats, isFetching: isStatsFetching } =
    useGetCampaignsStats();
  const { data: totalVolume, isFetching: isVolumeFetching } =
    useGetTotalVolume('');

  return (
    <Grid
      container
      component="section"
      width="100%"
      spacing={{ xs: 1.5, md: 3 }}
      mb={{ xs: 4, md: 8 }}
    >
      <Grid size={{ xs: 6, md: 4 }}>
        <Card isReverse={isMobile}>
          <CardTitle>
            {isMobile ? 'Rewards Pool' : 'Total Rewards Pool'}
          </CardTitle>
          {isStatsFetching ? (
            <Skeleton
              variant="text"
              height={isMobile ? 32 : 42}
              sx={{ mt: { xs: 0, md: 5 }, mb: { xs: 1, md: 0 } }}
            />
          ) : (
            <Typography
              variant={isMobile ? 'h6' : 'h4'}
              color="white"
              fontWeight={{ xs: 500, md: 800 }}
              mt={{ xs: 0, md: 5 }}
              mb={{ xs: 1, md: 0 }}
            >
              <FormattedNumber
                value={campaignsStats?.rewards_pool_usd}
                prefix="$"
              />
            </Typography>
          )}
        </Card>
      </Grid>
      <Grid size={{ xs: 6, md: 4 }}>
        <Card isReverse={isMobile}>
          <CardTitle>
            {isMobile ? 'Liquidity Provided' : 'Total Liquidity Provided'}
          </CardTitle>
          {isVolumeFetching ? (
            <Skeleton
              variant="text"
              height={isMobile ? 32 : 42}
              sx={{ mt: { xs: 0, md: 5 }, mb: { xs: 1, md: 0 } }}
            />
          ) : (
            <Typography
              variant={isMobile ? 'h6' : 'h4'}
              color="white"
              fontWeight={{ xs: 500, md: 800 }}
              mt={{ xs: 0, md: 5 }}
              mb={{ xs: 1, md: 0 }}
            >
              <FormattedNumber value={totalVolume} prefix="$" />
            </Typography>
          )}
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          {isConnected ? (
            <>
              <Typography
                variant="h5"
                color="white"
                textTransform="capitalize"
                lineHeight={{ xs: '150%', md: '100%' }}
                fontWeight={{ xs: 600, md: 800 }}
                mb={1}
              >
                Host Trading Campaigns in 5 Mins
              </Typography>
              <Typography
                variant={isMobile ? 'body2' : 'tooltip'}
                color="text.secondary"
                mb={{ xs: 3, md: 1.5 }}
              >
                Set up, fund, and go live with a fully tracked trading campaign
                in minutes.
              </Typography>
              <LaunchCampaignButton size="medium" />
            </>
          ) : (
            <>
              {!isMobile && (
                <CardTitle>
                  <LinkIcon sx={{ width: 16, height: 16 }} />
                  Wallet
                </CardTitle>
              )}
              <Typography
                variant="h5"
                color="white"
                textTransform="capitalize"
                fontWeight={{ xs: 600, md: 800 }}
                mb={{ xs: 1, md: 0 }}
              >
                Connect your wallet
              </Typography>
              <Typography
                variant={isMobile ? 'body2' : 'tooltip'}
                color="text.secondary"
                mb={{ xs: 3, md: 1.5 }}
              >
                and join / host campaigns in minutes
              </Typography>
              <ConnectWallet size={isMobile ? 'medium' : 'large'} />
            </>
          )}
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardWidgets;

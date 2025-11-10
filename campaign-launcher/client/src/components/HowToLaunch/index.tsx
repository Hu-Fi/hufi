import { Box, Paper, Typography, styled } from '@mui/material';
import Grid from '@mui/material/Grid2';

import { useIsXlDesktop } from '@/hooks/useBreakpoints';

const Card = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRadius: '16px',
  padding: '40px 16px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: 'none',
  width: '100%',
  [theme.breakpoints.down('xl')]: {
    padding: '32px 16px',
  },
  [theme.breakpoints.down('md')]: {
    paddingLeft: '32px',
    paddingTop: '16px',
    paddingBottom: '16px',
    justifyContent: 'flex-start',
  },
}));

const Circle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: theme.palette.text.disabled,
  color: theme.palette.text.primary,
  fontSize: '28px',
  fontWeight: 600,

  [theme.breakpoints.down('xl')]: {
    width: '56px',
    height: '56px',
    fontSize: '24px',
  },

  [theme.breakpoints.down('md')]: {
    width: '32px',
    height: '32px',
    fontSize: '14px',
  },
}));

const Text = styled(Typography)(({ theme }) => ({
  flex: 1,
  color: theme.palette.text.primary,
  fontSize: '32px',
  fontWeight: 800,
  lineHeight: '100%',
  letterSpacing: '-0.5px',

  [theme.breakpoints.down('xl')]: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: '120%',
    letterSpacing: '0.25px',
  },

  [theme.breakpoints.down('md')]: {
    fontSize: '20px',
    fontWeight: 500,
    lineHeight: '160%',
    letterSpacing: '0.15px',
  },
}));

const HowToLaunch = () => {
  const isXl = useIsXlDesktop();

  return (
    <Box
      component="section"
      display="flex"
      flexDirection="column"
      gap={{ xs: 2, md: 4, xl: 6.5 }}
    >
      <Typography
        variant={isXl ? 'h5' : 'h6'}
        px={{ xs: 2, md: 0 }}
        textAlign={{ xs: 'unset', md: 'center' }}
      >
        Easy and fast. How to launch a market making campaign.
      </Typography>
      <Grid container spacing={{ xs: 1, md: 2 }} justifyContent="center">
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <Circle>1</Circle>
            <Text>Stake HMT</Text>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <Circle>2</Circle>
            <Text>Launch Campaign</Text>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <Circle>3</Circle>
            <Text>Approve 3 Transactions</Text>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HowToLaunch;

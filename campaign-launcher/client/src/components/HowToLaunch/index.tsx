import { Box, Paper, Typography, styled } from '@mui/material';
import Grid from '@mui/material/Grid2';

import { useIsXlDesktop } from '@/hooks/useBreakpoints';

const Card = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRadius: '16px',
  padding: '40px 0px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: 'none',
  width: '100%',
  [theme.breakpoints.down('xl')]: {
    padding: '32px 0px',
  },
  [theme.breakpoints.down('md')]: {
    paddingLeft: '24px',
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
}));

const Text = styled(Typography)(({ theme }) => ({
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
}));

const HowToLaunch = () => {
  const isXl = useIsXlDesktop();

  return (
    <Box
      component="section"
      display="flex"
      flexDirection="column"
      gap={{ xs: 4, xl: 6.5 }}
    >
      <Typography variant={isXl ? 'h5' : 'h6'} textAlign="center">
        Easy and fast. How to launch a market making campaign.
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <Circle>1</Circle>
            <Text>
              Stake
              {isXl ? <br /> : ' '}
              HMT
            </Text>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <Circle>2</Circle>
            <Text>
              Launch
              {isXl ? <br /> : ' '}
              Campaign
            </Text>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <Circle>3</Circle>
            <Text>
              Approve 3<br />
              Transactions
            </Text>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HowToLaunch;

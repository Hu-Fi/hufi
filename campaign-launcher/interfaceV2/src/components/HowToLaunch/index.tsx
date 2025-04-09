import { Box, Paper, Typography, styled } from '@mui/material';
import Grid from '@mui/material/Grid2';

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
}));

const Card = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRadius: '16px',
  padding: '40px 0px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '16px',
  border: `1px solid rgba(255, 255, 255, 0.1)`,
  boxShadow: 'none',
  width: '100%',
}));

const Text = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '32px',
  fontWeight: 800,
  lineHeight: '100%',
  letterSpacing: '-0.5px',
}));

const HowToLaunch = () => {
  return (
    <>
      <Typography variant="h5" mb={6.5} textAlign="center">
        Easy and fast. How to launch a market making campaign.
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        <Grid size={4}>
          <Card>
            <Circle>1</Circle>
            <Text>
              Stake
              <br />
              HMT
            </Text>
          </Card>
        </Grid>
        <Grid size={4}>
          <Card>
            <Circle>2</Circle>
            <Text>
              Launch
              <br />
              Campaign
            </Text>
          </Card>
        </Grid>
        <Grid size={4}>
          <Card>
            <Circle>3</Circle>
            <Text>
              Approve 4<br />
              Transactions
            </Text>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default HowToLaunch;

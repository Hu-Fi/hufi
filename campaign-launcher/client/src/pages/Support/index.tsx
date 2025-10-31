import { type FC, useState } from 'react';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Stack,
  Typography,
  Skeleton,
} from '@mui/material';

import {
  CampaignsDiscovery,
  Prerequisites,
  ReachTargetAccordion,
  RewardsCalculation,
  SignIn,
  StepByStepProcess,
} from '@/components/FaqAccordionDetailsHub';
import PageTitle from '@/components/PageTitle';
import PageWrapper from '@/components/PageWrapper';

const commonSlotProps = {
  transition: { unmountOnExit: true },
  root: {
    elevation: 0,
    sx: {
      backgroundColor: 'background.default',
      '&.Mui-expanded:before': {
        opacity: 1,
        display: 'block !important',
      },
    },
  },
};

const firstAccordionSlotProps = {
  ...commonSlotProps,
  root: {
    ...commonSlotProps.root,
    sx: {
      ...commonSlotProps.root.sx,
      borderTopLeftRadius: '4px',
      borderTopRightRadius: '4px',
      '&:before': {
        display: 'none',
      },
      '&.Mui-expanded:before': {
        display: 'none',
      },
    },
  },
};

const SectionHeader = ({ title }: { title: string }) => (
  <Box display="flex" alignItems="center" gap={0.5} mb={2}>
    <ArrowForwardIcon />
    <Typography variant="h6">{title}</Typography>
  </Box>
);

interface VideoWrapperProps {
  src: string;
  title: string;
}

const VideoWrapper: FC<VideoWrapperProps> = ({ src, title }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      bgcolor="background.default"
      borderRadius="24px"
      width={{ xs: '100%', md: '480px', xxl: '640px' }}
      height="auto"
      overflow="hidden"
      position="relative"
      sx={{
        aspectRatio: '16/9',
        '& iframe': {
          border: 'none',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        },
      }}
    >
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bgcolor: 'rgba(255, 255, 255, 0.05)',
          }}
        />
      )}
      <iframe
        width="100%"
        height="100%"
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
        onLoad={() => setIsLoading(false)}
      />
    </Box>
  );
};

const Support: FC = () => {
  return (
    <PageWrapper>
      <PageTitle title="How to / F.A.Q" />
      <Box
        component="section"
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        gap={4}
        pb={4}
        borderBottom="1px solid rgba(255, 255, 255, 0.04)"
      >
        <Stack
          maxWidth={{ xs: '100%', md: '50%' }}
          flex={1}
          order={{ xs: 2, md: 1 }}
        >
          <SectionHeader title="How to launch a campaign" />
          <Typography variant="body2" mb={4}>
            Learn how to launch your campaign with ease—follow the written
            walkthrough or watch the detailed video tutorial.
          </Typography>
          <Accordion disableGutters slotProps={{ ...firstAccordionSlotProps }}>
            <AccordionSummary
              aria-controls="prerequisites-content"
              id="prerequisites-header"
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography variant="body1">Prerequisites</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Prerequisites />
            </AccordionDetails>
          </Accordion>
          <Accordion disableGutters slotProps={{ ...commonSlotProps }}>
            <AccordionSummary
              aria-controls="step-by-step-process-content"
              id="step-by-step-process-header"
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography variant="body1">Step-by-step-process</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <StepByStepProcess />
            </AccordionDetails>
          </Accordion>
        </Stack>
        <Box
          display="flex"
          maxWidth={{ xs: '100%', md: '50%' }}
          flex={1}
          justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
          position={{ xs: 'relative', md: 'sticky' }}
          top={{ xs: 0, md: 32 }}
          bottom={{ xs: 0, md: 32 }}
          height="fit-content"
          order={{ xs: 1, md: 2 }}
        >
          <VideoWrapper
            src="https://www.youtube.com/embed/sYbcFpGnRq4?si=PmdrxdVlUiZNXXFm"
            title="How to Launch a HuFi Campaign"
          />
        </Box>
      </Box>
      <Box
        component="section"
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        gap={4}
        pb={4}
        borderBottom="1px solid rgba(255, 255, 255, 0.04)"
      >
        <Stack
          maxWidth={{ xs: '100%', md: '50%' }}
          flex={1}
          order={{ xs: 2, md: 1 }}
        >
          <SectionHeader title="How to participate in a campaign" />
          <Typography variant="body2" mb={4}>
            Discover how to participate in a campaign with ease. Choose between
            a detailed written walkthrough or a step-by-step video tutorial.
          </Typography>
          <Accordion disableGutters slotProps={{ ...firstAccordionSlotProps }}>
            <AccordionSummary
              aria-controls="sign-in-content"
              id="sign-in-header"
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography variant="body1">Sign in</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <SignIn />
            </AccordionDetails>
          </Accordion>
          <Accordion disableGutters slotProps={{ ...commonSlotProps }}>
            <AccordionSummary
              aria-controls="campaigns-discovery-content"
              id="campaigns-discovery-header"
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography variant="body1">Campaigns discovery</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <CampaignsDiscovery />
            </AccordionDetails>
          </Accordion>
          <Accordion disableGutters slotProps={{ ...commonSlotProps }}>
            <AccordionSummary
              aria-controls="trading-content"
              id="trading-header"
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography variant="body1">Trading</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                Once you join a campaign (or a few) you need to start trading on
                the exchange campaign is running on. Results will be calculated
                daily (you can see details on FAQ page) and payouts will be run
                daily.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Stack>
        <Box
          display="flex"
          maxWidth={{ xs: '100%', md: '50%' }}
          flex={1}
          justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
          position={{ xs: 'relative', md: 'sticky' }}
          top={{ xs: 0, md: 32 }}
          bottom={{ xs: 0, md: 32 }}
          height="fit-content"
          order={{ xs: 1, md: 2 }}
        >
          <VideoWrapper
            src="https://www.youtube.com/embed/8GtwoIhxlMc?si=YEckN6oAqvYFMlTz"
            title="How to Participate in a HuFi Campaign"
          />
        </Box>
      </Box>
      <Box component="section">
        <SectionHeader title="F.A.Q." />
        <Typography variant="body2" mb={4}>
          For assistance, explore our FAQ section for common questions. If you
          need further support, contact us by email—we&apos;ll be glad to help.
        </Typography>
        <Accordion disableGutters slotProps={{ ...firstAccordionSlotProps }}>
          <AccordionSummary
            aria-controls="market-making-campaign-content"
            id="market-making-campaign-header"
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography variant="body1">
              What is a Market Making campaign?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              A Market Making campaign sets up a task for market makers to
              generate a specified amount of trading activity on a chosen
              trading pair (e.g., ETH/USDT) at a given exchange (e.g. MEXC).
              This helps boost visibility, attract organic traders, and
              strengthen the market presence of the pair.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion disableGutters slotProps={{ ...commonSlotProps }}>
          <AccordionSummary
            aria-controls="holding-campaign-content"
            id="holding-campaign-header"
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography variant="body1">What is a Holding campaign?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              A Holding campaign requires market makers to keep a specified
              amount of a token (e.g., ETH) available in their exchange (e.g.
              MEXC) account balance. This guarantees that sufficient inventory
              is always on hand for quoting buy and sell orders, which supports
              deeper order books, tighter spreads, and smoother trading
              conditions.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion disableGutters slotProps={{ ...commonSlotProps }}>
          <AccordionSummary
            aria-controls="calculate-rewards-content"
            id="calculate-rewards-header"
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography variant="body1">
              How do we calculate the rewards?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <RewardsCalculation />
          </AccordionDetails>
        </Accordion>
        <Accordion disableGutters slotProps={{ ...commonSlotProps }}>
          <AccordionSummary
            aria-controls="exchange-api-keys-content"
            id="exchange-api-keys-header"
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography variant="body1">
              Why do you need my exchange API keys?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              We need API keys to fetch the trades an account has made recently
              in order to calculate a participant’s share. We only require{' '}
              <strong>read-only access</strong> to your trade history, so your
              funds will remain safe. You can also control the API key
              permissions directly on your exchange.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion disableGutters slotProps={{ ...commonSlotProps }}>
          <AccordionSummary
            aria-controls="dvt-content"
            id="dvt-header"
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography variant="body1">
              What happens if participants are struggling to reach the daily
              volume target?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ReachTargetAccordion />
          </AccordionDetails>
        </Accordion>
      </Box>
    </PageWrapper>
  );
};

export default Support;

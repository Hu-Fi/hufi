import { type FC, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Link,
  Stack,
  Typography,
} from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';

const accordionSx = {
  bgcolor: '#251d47',
  border: '1px solid #433679',
  '&:first-of-type': {
    borderRadius: '10px 10px 0 0',
  },
  '&:not(:last-of-type)': {
    borderBottom: 'none',
  },
  '&:last-of-type': {
    borderRadius: '0 0 10px 10px',
  },
  '&:before': { display: 'none' },
  '& .MuiAccordionSummary-root': { minHeight: '52px' },
  '& .MuiAccordionSummary-content': { my: 0 },
};

const FAQ: FC = () => {
  const [expanded, setExpanded] = useState<string[]>([]);

  const isMobile = useIsMobile();

  return (
    <Stack gap={{ xs: 2, md: 3 }}>
      <Typography
        variant={isMobile ? 'h6' : 'h5'}
        color="white"
        fontWeight={{ xs: 500, md: 800 }}
        letterSpacing={{ xs: '0px', md: '-0.5px' }}
      >
        FAQ
      </Typography>
      <Stack>
        <Accordion
          expanded={expanded.includes('faq-0')}
          onChange={(_, nextExpanded) =>
            setExpanded((prev) =>
              nextExpanded
                ? [...prev, 'faq-0']
                : prev.filter((id) => id !== 'faq-0')
            )
          }
          disableGutters
          elevation={0}
          square
          sx={accordionSx}
        >
          <AccordionSummary
            expandIcon={
              expanded.includes('faq-0') ? (
                <RemoveIcon sx={{ color: 'white' }} />
              ) : (
                <AddIcon sx={{ color: 'white' }} />
              )
            }
          >
            <Typography variant="body2" color="white" fontWeight={600}>
              How do I add an API key?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack>
              <Typography variant="body2" fontWeight={500}>
                To connect your exchange account:
              </Typography>
              <Stack
                component="ol"
                sx={{ m: 0, pl: 2.5, gap: 0.25, '& li': { fontWeight: 500 } }}
              >
                <Typography component="li" variant="body2">
                  Go to your exchange account settings.
                </Typography>
                <Typography component="li" variant="body2">
                  Create a new API key with trading permissions enabled.
                </Typography>
                <Typography component="li" variant="body2">
                  Copy the API Key and Secret Key.
                </Typography>
                <Typography component="li" variant="body2">
                  Paste them in the API key section here and save.
                </Typography>
              </Stack>
              <Typography variant="body2" mt={1} fontWeight={500}>
                For a more detailed explanation, visit:
              </Typography>
              <Link
                href="https://docs.hu.finance/campaign-participation/api-keys/"
                target="_blank"
                rel="noreferrer"
                variant="body2"
                fontWeight={500}
              >
                https://docs.hu.finance/campaign-participation/api-keys/
              </Link>
            </Stack>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded.includes('faq-1')}
          onChange={(_, nextExpanded) =>
            setExpanded((prev) =>
              nextExpanded
                ? [...prev, 'faq-1']
                : prev.filter((id) => id !== 'faq-1')
            )
          }
          disableGutters
          elevation={0}
          square
          sx={accordionSx}
        >
          <AccordionSummary
            expandIcon={
              expanded.includes('faq-1') ? (
                <RemoveIcon sx={{ color: 'white' }} />
              ) : (
                <AddIcon sx={{ color: 'white' }} />
              )
            }
          >
            <Typography variant="body2" color="white" fontWeight={600}>
              How do I stake HMT?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack>
              <Typography variant="body2" fontWeight={500}>
                To stake your HMT tokens:
              </Typography>
              <Stack
                component="ol"
                sx={{ m: 0, pl: 2.5, gap: 0.25, '& li': { fontWeight: 500 } }}
              >
                <Typography component="li" variant="body2">
                  Connect your wallet.
                </Typography>
                <Typography component="li" variant="body2">
                  Navigate to the Staking section.
                </Typography>
                <Typography component="li" variant="body2">
                  Enter the amount of HMT you want to stake.
                </Typography>
                <Typography component="li" variant="body2">
                  Confirm the transaction in your wallet.
                </Typography>
              </Stack>
              <Typography variant="body2" fontWeight={500} mt={1}>
                For a more detailed explanation, visit:
              </Typography>
              <Link
                href="https://docs.hu.finance/campaign-creation/#1-staking"
                target="_blank"
                rel="noreferrer"
                variant="body2"
                fontWeight={500}
              >
                https://docs.hu.finance/campaign-creation/#1-staking
              </Link>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expanded.includes('faq-2')}
          onChange={(_, nextExpanded) =>
            setExpanded((prev) =>
              nextExpanded
                ? [...prev, 'faq-2']
                : prev.filter((id) => id !== 'faq-2')
            )
          }
          disableGutters
          elevation={0}
          square
          sx={accordionSx}
        >
          <AccordionSummary
            expandIcon={
              expanded.includes('faq-2') ? (
                <RemoveIcon sx={{ color: 'white' }} />
              ) : (
                <AddIcon sx={{ color: 'white' }} />
              )
            }
          >
            <Typography variant="body2" color="white" fontWeight={600}>
              How are campaign rewards distributed?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack>
              <Typography variant="body2" fontWeight={500}>
                Campaign rewards are distributed based on the trading
                performance and volume generated during the campaign period.
                Once the campaign ends, eligible participants will receive
                rewards directly to their connected wallet.
              </Typography>
              <Typography variant="body2" fontWeight={500} mt={1}>
                For a more detailed explanation, visit:
              </Typography>
              <Link
                href="https://docs.hu.finance/holding/#reward-distribution"
                target="_blank"
                rel="noreferrer"
                variant="body2"
                fontWeight={500}
              >
                https://docs.hu.finance/holding/#reward-distribution
              </Link>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Stack>
  );
};

export default FAQ;

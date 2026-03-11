import { type FC, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I add an API key?',
    answer: 'How do I add an API key?',
  },
  {
    question: 'How do I add an API key?',
    answer: 'How do I add an API key?',
  },
  {
    question: 'How do I add an API key?',
    answer: 'How do I add an API key?',
  },
];

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
        {FAQ_ITEMS.map((item, index) => {
          const panelId = `faq-${index}`;
          const isExpanded = expanded.includes(panelId);
          return (
            <Accordion
              key={panelId}
              expanded={isExpanded}
              onChange={(_, nextExpanded) =>
                setExpanded((prev) =>
                  nextExpanded
                    ? [...prev, panelId]
                    : prev.filter((id) => id !== panelId)
                )
              }
              disableGutters
              elevation={0}
              square
              sx={{
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
              }}
            >
              <AccordionSummary
                expandIcon={
                  isExpanded ? (
                    <RemoveIcon sx={{ color: 'white' }} />
                  ) : (
                    <AddIcon sx={{ color: 'white' }} />
                  )
                }
              >
                <Typography variant="body2" color="white" fontWeight={600}>
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="white">
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default FAQ;

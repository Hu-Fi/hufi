import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';

import {
  firstSmallAccordionProps,
  smallAccordionProps,
  smallAccordionSummaryProps,
  smallAccordionDetailsProps,
} from './styles';

const ReachTargetAccordion = () => {
  return (
    <>
      <Accordion disableGutters slotProps={{ ...firstSmallAccordionProps }}>
        <AccordionSummary
          aria-controls="market-making-target-content"
          id="market-making-target-header"
          expandIcon={<ExpandMoreIcon />}
          slotProps={{ ...smallAccordionSummaryProps }}
        >
          <Typography variant="body2">Market Making Campaigns</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ ...smallAccordionDetailsProps }}>
          <Typography variant="body2">
            If participants fail to reach the daily volume target, the reward
            pool will be reduced. Any unused funds remaining at the end of the
            campaign will be automatically transferred back to the wallet from
            which the campaign was created.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion disableGutters slotProps={{ ...smallAccordionProps }}>
        <AccordionSummary
          aria-controls="holding-target-content"
          id="holding-target-header"
          expandIcon={<ExpandMoreIcon />}
          slotProps={{ ...smallAccordionSummaryProps }}
        >
          <Typography variant="body2">Holding Campaigns</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ ...smallAccordionDetailsProps }}>
          <Typography variant="body2">
            If participants fail to reach the daily balance target, the reward
            pool will be reduced. Any unused funds remaining at the end of the
            campaign will be automatically transferred back to the wallet from
            which the campaign was created.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default ReachTargetAccordion;

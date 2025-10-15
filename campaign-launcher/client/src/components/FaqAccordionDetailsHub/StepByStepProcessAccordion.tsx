import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";

import { 
  firstSmallAccordionProps, 
  smallAccordionProps, 
  smallAccordionSummaryProps,
  smallAccordionDetailsProps 
} from './styles';

const StepByStepProcessAccordion = () => {
  return (
    <>
      <Accordion disableGutters slotProps={{ ...firstSmallAccordionProps }}>
        <AccordionSummary 
          aria-controls="market-making-campaigns-content"
          id="market-making-campaigns-header"
          expandIcon={<ExpandMoreIcon />}
          slotProps={{ ...smallAccordionSummaryProps }}
        >
          <Typography variant="body2">Market Making Campaigns</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ ...smallAccordionDetailsProps }}>
          <Typography variant="body2" fontWeight={700}>Exchange:</Typography>
          <Typography variant="body2">
            Exchange where you want to participants to generate volume
          </Typography>
          <Typography variant="body2" fontWeight={700}>Trading pair:</Typography>
          <Typography variant="body2">
            A pair of tokens you want users to trade (e.g. ETH/USDT)
          </Typography>
          <Typography variant="body2" fontWeight={700}>Start date:</Typography>
          <Typography variant="body2">
            Date when the campaign will start. If you choose today&apos;s date, the campaign will start immediately,
            otherwise it will start at 00:00 your timezone of the date you chose.
          </Typography>
          <Typography variant="body2" fontWeight={700}>End date:</Typography>
          <Typography variant="body2">
            Date when the campaign will end.
          </Typography>
          <Typography variant="body2" fontWeight={700}>Fund token:</Typography>
          <Typography variant="body2">
            A token you want to fund a campaign with, either HMT, USDT or USDC.
            Basically it&apos;s a reward token for participants.
          </Typography>
          <Typography variant="body2" fontWeight={700}>Fund amount:</Typography>
          <Typography variant="body2">
            Amount of the reward you want to fund an escrow with.
            This amount will be divided into the campaign duration to form a daily reward pool.
            Just remember, the higher the reward, more enthusiastic participants will be about your campaign.
          </Typography>
          <Typography variant="body2" fontWeight={700}>Daily volume target:</Typography>
          <Typography variant="body2">
            A target you want to set for a quote token that should be reached daily.
            If participants reach this target (and above), the daily reward pool will be distributed fully,
            otherwise proportionally to the target you set.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion disableGutters slotProps={{ ...smallAccordionProps }}>
        <AccordionSummary 
          aria-controls="holding-campaigns-content"
          id="holding-campaigns-header"
          expandIcon={<ExpandMoreIcon />}
          slotProps={{ ...smallAccordionSummaryProps }}
        >
          <Typography variant="body2">Holding Campaigns</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ ...smallAccordionDetailsProps }}>
          <Typography variant="body2" fontWeight={700}>Exchange:</Typography>
          <Typography variant="body2">
            Exchange where you want to participants to generate volume
          </Typography>
          <Typography variant="body2" fontWeight={700}>Symbol:</Typography>
          <Typography variant="body2">
            A token you want users to hold on a specified exchange (e.g. ETH)
          </Typography>
          <Typography variant="body2" fontWeight={700}>Start date:</Typography>
          <Typography variant="body2">
            Date when the campaign will start. If you choose today&apos;s date, the campaign will start immediately,
            otherwise it will start at 00:00 your timezone of the date you chose.
          </Typography>
          <Typography variant="body2" fontWeight={700}>End date:</Typography>
          <Typography variant="body2">
            Date when the campaign will end.
          </Typography>
          <Typography variant="body2" fontWeight={700}>Fund token:</Typography>
          <Typography variant="body2">
            A token you want to fund a campaign with, either HMT, USDT or USDC.
            Basically it&apos;s a reward token for participants.
          </Typography>
          <Typography variant="body2" fontWeight={700}>Fund amount:</Typography>
          <Typography variant="body2">
            Amount of the reward you want to fund an escrow with. 
            This amount will be divided into the campaign duration to form a daily reward pool. 
            Just remember, the higher the reward, more enthusiastic participants will be about your campaign.
          </Typography>
          <Typography variant="body2" fontWeight={700}>Daily balance target:</Typography>
          <Typography variant="body2">
            A target you want to set for the total amount of assets held on the exchange that should be maintained daily. 
            If participants meet or exceed this target, the daily reward pool will be distributed fully; 
            otherwise, rewards will be distributed proportionally to the achieved balance relative to the target.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </>
  )
}

export default StepByStepProcessAccordion;

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { 
  Accordion, 
  AccordionDetails,
  AccordionSummary, 
  List, 
  ListItem, 
  ListItemText, 
  Stack, 
  Typography 
} from "@mui/material";

import { 
  listItemTextProps, 
  listItemWithMarkerProps,
  firstSmallAccordionProps,
  smallAccordionProps,
  smallAccordionSummaryProps,
  smallAccordionDetailsProps,
 } from './styles';

const RewardsCalculation = () => {
  return (
    <Stack>
      <Accordion disableGutters slotProps={{ ...firstSmallAccordionProps }}>
        <AccordionSummary
          aria-controls="market-making-rewards-content"
          id="market-making-rewards-header"
          expandIcon={<ExpandMoreIcon />}
          slotProps={{ ...smallAccordionSummaryProps }}
        >
          <Typography variant="body2">
            Market Making Campaigns
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ ...smallAccordionDetailsProps }}>
          <Typography variant="body2">
            Every campaign has 3 parameters: fund amount, duration and daily volume target. 
            The first step is calculating the daily reward pool:
          </Typography>
          <Typography variant="body2">
            <Typography component="span" fontSize={14} fontStyle="italic" fontFamily="Inria Serif">
              dailyRewardPool = fundAmount / duration (in days).
            </Typography>
            {' '}For the duration we use <code>Math.ceil()</code> function which means that 25 hours will be considered as 2 days.
          </Typography>
          <Typography variant="body2">
            For each campaign, we track progress in 24-hour periods from its start by fetching all trades made by participants 
            and check whether the combined generated volume reaches the daily volume target.
          </Typography>
          <List component="ul" sx={{ listStyleType: 'disc', p: 0, pl: 2 }}>
            <ListItem sx={listItemWithMarkerProps}>
              <ListItemText 
                primary="If yes, the daily reward pool is fully distributed based on each participant's performance." 
                slotProps={listItemTextProps} 
              />
            </ListItem>
            <ListItem sx={listItemWithMarkerProps}>
              <ListItemText 
                primary="If not, the daily reward pool is reduced proportionally, based on the ratio between total generated volume and the daily volume target." 
                slotProps={listItemTextProps} 
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
      <Accordion disableGutters slotProps={{ ...smallAccordionProps }}>
        <AccordionSummary
          aria-controls="holding-rewards-content"
          id="holding-rewards-header"
          expandIcon={<ExpandMoreIcon />}
          slotProps={{ ...smallAccordionSummaryProps }}
        >
          <Typography variant="body2">
            Holding Campaigns
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ ...smallAccordionDetailsProps }}>
          <Typography variant="body2">
            Every campaign has 3 parameters: fund amount, duration and daily balance target. 
            The first step is calculating the daily reward pool:
          </Typography>
          <Typography variant="body2">
            <Typography component="span" fontSize={14} fontStyle="italic" fontFamily="Inria Serif">
              dailyRewardPool = fundAmount / duration (in days).
            </Typography>
            {' '}For the duration we use <code>Math.ceil()</code> function which means that 25 hours will be considered as 2 days.
          </Typography>
          <Typography variant="body2">
            For each campaign, we track progress in 24-hour periods from its start by fetching participants 
            balances and check whether the sum of them reaches the daily balance target.
          </Typography>
          <List component="ul" sx={{ listStyleType: 'disc', p: 0, pl: 2 }}>
            <ListItem sx={listItemWithMarkerProps}>
              <ListItemText 
                primary="If yes, the daily reward pool is fully distributed based on each participant's performance." 
                slotProps={listItemTextProps} 
              />
            </ListItem>
            <ListItem sx={listItemWithMarkerProps}>
              <ListItemText 
                primary="If not, the daily reward pool is reduced proportionally, based on the ratio between total amount of assets held and the daily balance target." 
                slotProps={listItemTextProps} 
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
}

export default RewardsCalculation;
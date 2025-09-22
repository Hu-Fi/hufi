import { List, ListItem, ListItemText, Stack, Typography } from "@mui/material";

import { listItemTextProps, listItemWithMarkerProps } from './styles';

const RewardsCalculation = () => {
  return (
    <Stack>
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
    </Stack>
  )
}

export default RewardsCalculation;
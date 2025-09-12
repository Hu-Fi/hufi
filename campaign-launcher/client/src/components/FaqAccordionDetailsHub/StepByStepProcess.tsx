import { List, ListItem, ListItemText, Stack, Typography } from "@mui/material";

import { listItemTextProps, listItemWithMarkerProps, listItemWithNumberProps } from './styles';

const StepByStepProcess = () => {
  return (
    <Stack>
      <List component="ol" sx={{ listStyleType: 'decimal', ml: 2.5, p: 0 }}>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Click on 'Sign in' button in a top right corner of the HuFi home page"
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Choose a provider"
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Choose a wallet you want to connect and finish the process"
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Once it's completed, 'Launch Campaign' button will become available
              and right next to it you'll see your wallet address which indicates that you've successfully connected your wallet"
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Make sure that you're choosing the right network, you can do that via chain selector"
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Click on 'Launch Campaign'"
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            slotProps={listItemTextProps}
            primary={
              <>
                <Typography variant="body2" mb={2}>
                  In an opened modal you&apos;ll be asked to fill in the details about the campaign you want to create
                </Typography>
                <Typography variant="body2" mb={2}>Let&apos;s break down what all the fields mean:</Typography>
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
                  otherwise it will start at 00:00 UTC of the date you chose.
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
                <Typography variant="body2" mb={2}>
                  A targer you want to set for a quote token that should be reached daily.
                  If participants reach this target (and above), the daily reward pool will be distributed fully,
                  otherwise proportionally to the target you set.
                </Typography>
              </>
            }
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Once everything is filled, click on 'Create Campaign'. After that, you will be asked to confirm 3 transactions:"
            slotProps={listItemTextProps}
          />
          <List component="ul" sx={{ listStyleType: 'disc', p: 0, pl: 2 }}>
            <ListItem sx={listItemWithMarkerProps}>
              <ListItemText 
                primary="Campaign (escrow) creation" 
                slotProps={listItemTextProps} 
              />
            </ListItem>
            <ListItem sx={listItemWithMarkerProps}>
              <ListItemText 
                primary="Transfer (for funding the campaign with the reward pool you chose)" 
                slotProps={listItemTextProps} 
              />
            </ListItem>
            <ListItem sx={listItemWithMarkerProps}>
              <ListItemText 
                primary="Setup (for passing all the details about the campaign: exchange, trading pair, etc.)" 
                slotProps={listItemTextProps} 
              />
            </ListItem>
          </List>
        </ListItem>
        <ListItem disablePadding sx={{ ...listItemWithNumberProps, mt: 2 }}>
          <ListItemText 
            primary="After everythin is completed, you will be redirected to the page 
              where you can see details about the campaign you've recently created"
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={{ ...listItemWithNumberProps, mt: 2 }}>
          <ListItemText 
            primary="If you want to see the list of the campaigns you created, 
              you can always go to the home page (dashboard) and choose 'My campaigns' in a dropdown menu."
            slotProps={listItemTextProps}
          />
        </ListItem>
      </List>
    </Stack>
  )
}

export default StepByStepProcess;
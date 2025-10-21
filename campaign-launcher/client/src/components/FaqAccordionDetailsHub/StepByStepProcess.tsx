import { List, ListItem, ListItemText, Stack, Typography } from '@mui/material';

import StepByStepProcessAccordion from './StepByStepProcessAccordion';
import {
  listItemTextProps,
  listItemWithMarkerProps,
  listItemWithNumberProps,
} from './styles';

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
            primary={
              <Stack mb={2}>
                <Typography variant="body2">
                  Click on &apos;Launch Campaign&apos;, in an opened modal
                  you&apos;ll be asked to fill in the details about the campaign
                  you want to create.
                </Typography>
                <Typography variant="body2" mb={2}>
                  Let&apos;s break down what all the fields mean:
                </Typography>
                <StepByStepProcessAccordion />
              </Stack>
            }
            slotProps={listItemTextProps}
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
            primary="After everything is completed, you will be redirected to the page 
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
  );
};

export default StepByStepProcess;

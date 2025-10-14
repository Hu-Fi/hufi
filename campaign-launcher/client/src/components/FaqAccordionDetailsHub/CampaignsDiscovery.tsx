import { Box, List, ListItem, ListItemText, Typography } from "@mui/material"

import { listItemTextProps, listItemWithMarkerProps } from './styles';

const CampaignsDiscovery = () => {
  return (
    <Box>
      <Typography variant="body2">Navigate to the home page:</Typography>
      <Typography variant="body2" mb={2}>
        By default, &apos;Only Active Campaigns&apos; filter should be applied, however you might be interested in all campaigns.
        To do that you need to toggle the switch in a right side of a page.
      </Typography>
      <Typography variant="body2" mb={2} fontWeight={700}>
        Lets break down the information about a campaign showed on a dashboard:
      </Typography>
      <img src="/tableImage.png" alt="Campaigns discovery" width="100%" height="auto" />
      <Typography variant="body2" mt={2}>
        <strong>Symbol:{' '}</strong>A token or a pair of tokens you will need to trade
      </Typography>
      <Typography variant="body2">
        <strong>Exchange:{' '}</strong>An exchange where you will need to trade.
      </Typography>
      <Typography variant="body2">
        <strong>Type:{' '}</strong>The campaign type, can be Holding or Market Making.
      </Typography>
      <Typography variant="body2">
        <strong>Network:{' '}</strong>Network on which campaign is created and where you will get your rewards.
      </Typography>
      <Typography variant="body2">
        <strong>Address:{' '}</strong>Since every campaign is a smart contract, you can check the information about this contract in a blockchain explorer.
      </Typography>
      <Typography variant="body2">
        <strong>Start date:{' '}</strong>A date when the campaign starts (might be in the future).
      </Typography>
      <Typography variant="body2">
        <strong>End date:{' '}</strong>A date when the campaign ends.
      </Typography>
      <Typography variant="body2">
        <strong>Fund amount:{' '}</strong>A reward pool for the campaign.
      </Typography>
      <Typography variant="body2">
        And the last but not least is a campaign status indicator:
      </Typography>
      <Box display="flex" my={2} alignItems="center" columnGap={4} rowGap={1} width="100%" flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box width="8px" height="8px" borderRadius="100%" border="1px solid rgba(212, 207, 255, 0.50)" bgcolor="success.main" />
          <Typography variant="body2" fontSize={9}>Active</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box width="8px" height="8px" borderRadius="100%" border="1px solid rgba(212, 207, 255, 0.50)" bgcolor="warning.main" />
          <Typography variant="body2" fontSize={9}>Awaiting start date</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box width="8px" height="8px" borderRadius="100%" border="1px solid rgba(212, 207, 255, 0.50)" bgcolor="error.main" />
          <Typography variant="body2" fontSize={9}>Campaign is finished, waiting for payouts</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box width="8px" height="8px" borderRadius="100%" border="1px solid rgba(212, 207, 255, 0.50)" bgcolor="secondary.main" />
          <Typography variant="body2" fontSize={9}>Completed</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box width="8px" height="8px" borderRadius="100%" border="1px solid rgba(212, 207, 255, 0.50)" bgcolor="primary.main" />
          <Typography variant="body2" fontSize={9}>Cancelled</Typography>
        </Box>
      </Box>
      <Typography variant="body2">
        You can click on a campaign you want to participate in and you will be redirected to the campaign details page.
      </Typography>
      <Typography variant="body2">
        To join the campaign you need to click on &apos;Join Campaign&apos;. There are 2 possible outcomes:
      </Typography>
      <List component="ul" sx={{ listStyleType: 'disc', p: 0, pl: 4 }}>
        <ListItem sx={listItemWithMarkerProps}>
          <ListItemText 
            primary="
              In case you have yet to add an API key for the exchange, where trades need to be made to the platform.
              In this case you will see a modal where you need to put your read-only (we only need access to the trade history) API key." 
            slotProps={listItemTextProps} 
          />
        </ListItem>
        <ListItem sx={listItemWithMarkerProps}>
          <ListItemText 
            primary="After that you will be joined to the campaign and you can start trading." 
            slotProps={listItemTextProps} 
          />
        </ListItem>
        <ListItem sx={listItemWithMarkerProps}>
          <ListItemText 
            primary={
              <Typography variant="body2">
                You already added a{' '}
                <Typography variant="body2" component="span" color="primary" fontStyle="italic" sx={{ textDecoration: 'underline' }}>read-only</Typography>
                {' '}API key for the exchange, where trades need to be made to the platform.
                In this case &apos;Join Campaign&apos; button will be replaced with &apos;Registered to Campaign&apos; button.
              </Typography>
            } 
            slotProps={listItemTextProps} 
          />
        </ListItem>
      </List>
      <Typography variant="body2">
        You can always check the list of the campaigns you joined to by choosing &apos;Joined Campaigns&apos; on a home page.
      </Typography>
    </Box>
  )
}

export default CampaignsDiscovery;

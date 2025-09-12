import { List, ListItem, ListItemText, Stack, Typography } from "@mui/material";

import { listItemWithNumberProps, listItemTextProps } from './styles';

const SignIn = () => {
  return (
    <Stack>
      <Typography variant="body2" mb={2}>
        Joining a campaign requires signing a message on the chain and API keys which are covered here
      </Typography>
      <Typography variant="body2" mb={2} fontWeight={700}>
        Sign in
      </Typography>
      <List component="ol" sx={{ listStyleType: 'decimal', ml: 2.5, p: 0 }}>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Click Connect Wallet (top-right corner)."
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Choose a provider and wallet, then connect."
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Your wallet address will appear in the top-right corner, confirming the connection."
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Open the dropdown and select Sign in."
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Sign the verification message (proof that you own the wallet)."
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Once signed in, you'll be able to select 'Manage API Keys' from the dropdown menu."
            slotProps={listItemTextProps}
          />
        </ListItem>
      </List>
      <Typography variant="body2" my={2} fontWeight={700}>
        Api keys management
      </Typography>
      <List component="ol" sx={{ listStyleType: 'decimal', ml: 2.5, p: 0 }}>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="In the top-right corner, click on your wallet address and go to 'Manage API keys'. 
              (This is where all your API keys with different exchanges are stored and managed)"
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="In the top-right corner, click on your wallet address and go to 'Manage API keys'. 
              (This is where all your API keys with different exchanges are stored and managed)"
            slotProps={listItemTextProps}
          />
        </ListItem>
        <ListItem disablePadding sx={listItemWithNumberProps}>
          <ListItemText 
            primary="Once set, you'll be able to join campaigns running for the exchange you've added your keys."
            slotProps={listItemTextProps}
          />
        </ListItem>
      </List>
    </Stack>
  )
}

export default SignIn;  
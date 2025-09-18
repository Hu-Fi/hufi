import { Link, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';

import { listItemTextProps, listItemWithMarkerProps } from './styles';

const Prerequisites = () => {
  return (
    <Stack>
      <List component="ol" sx={{ listStyleType: 'decimal', ml: 2.5 }}>
        <ListItem 
          disablePadding 
          sx={{
            display: 'list-item', 
            mb: 2,
            '&::marker': { 
              fontSize: '14px', 
              fontWeight: 700, 
              lineHeight: '20px',
              fontVariantNumeric: 'diagonal-fractions' 
            } 
          }}
        >
          <ListItemText 
            primary="Staking" 
            slotProps={{ 
              primary: { 
                variant: 'body2', 
                sx: { fontWeight: 700 } 
              }, 
              root: { 
                sx: { mt: 0, mb: 2 }
              } 
            }} 
          />
          <Typography variant="body2">
            To launch a campaign, you must stake HMT using your wallet on the same network.
          </Typography>
          <Typography variant="body2" mt={2} fontWeight={700}>You can do that by either:</Typography>
          <List component="ul" sx={{ listStyleType: 'disc', p: 0, pl: 2 }}>
            <ListItem sx={listItemWithMarkerProps}>
              <ListItemText 
                primary={
                  <Typography variant="body2">
                    Going directly to{' '}
                    <Link 
                      href="https://staking.humanprotocol.org/" 
                      target="_blank" 
                      sx={{ textDecoration: 'underline' }}
                    >
                      https://staking.humanprotocol.org/
                    </Link> 
                    {' '}or
                  </Typography>
                }
                slotProps={listItemTextProps} 
              />
            </ListItem>
            <ListItem sx={listItemWithMarkerProps}>
              <ListItemText 
                primary="Click on 'Stake HMT' on HuFi client" 
                slotProps={listItemTextProps} 
              />
            </ListItem>
          </List>
        </ListItem>
        <ListItem 
          disablePadding 
          sx={{
            display: 'list-item', 
            '&::marker': { 
              fontSize: '14px', 
              fontWeight: 700, 
              lineHeight: '20px',
              fontVariantNumeric: 'diagonal-fractions' 
            } 
          }}
        >
          <ListItemText 
            primary="Wallet balance"
            slotProps={{ 
              primary: { 
                variant: 'body2', 
                sx: { fontWeight: 700 } 
              }, 
              root: { 
                sx: { mt: 0, mb: 2 }
              } 
            }}  
          />
          <Typography variant="body2" fontWeight={700}>
            Ensure you have enough to cover
          </Typography>
          <List component="ul" sx={{ listStyleType: 'disc', p: 0, pl: 2, listStylePosition: 'outside' }}>
            <ListItem sx={listItemWithMarkerProps}>
              <ListItemText 
                primary="Gas fees (for campaign creation/escrow)" 
                slotProps={listItemTextProps} 
              />
            </ListItem>
            <ListItem sx={listItemWithMarkerProps}>
              <ListItemText 
                primary="Campaign funding in HMT or USDT (reward pool)" 
                slotProps={listItemTextProps} 
              />
            </ListItem>
          </List>
        </ListItem>
      </List>
    </Stack>
  )
};

export default Prerequisites;

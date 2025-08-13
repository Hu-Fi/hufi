import { FC, useState } from 'react';

import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import { useAccount } from 'wagmi';

import { ArrowDownIcon } from '../../icons';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';
import { CampaignsView } from '../../types';

type Props = {
  campaignsView: CampaignsView;
  onChange: (view: CampaignsView) => void;
}

const CampaignsViewDropdown: FC<Props> = ({ campaignsView, onChange }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { isConnected } = useAccount();
  const { isAuthenticated } = useWeb3Auth()
  
  const open = !!anchorEl;

  const handleClose = () => setAnchorEl(null);

  const handleMenuItemClick = (view: CampaignsView) => {
    if (view === campaignsView) return;

    onChange(view);
    handleClose();
  };

  return (
    <>
      <Button
        variant="text"
        size="medium"
        aria-controls={open ? 'campaigns-view-dropdown' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        disableRipple
        disableFocusRipple
        sx={{
          justifyContent: 'flex-start',
          p: 0,
          '&:hover': {
            backgroundColor: 'inherit',
          },
        }}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <Typography variant="h6" color="text.primary">
          {campaignsView === CampaignsView.ALL && 'All Campaigns'}
          {campaignsView === CampaignsView.JOINED && 'Joined Campaigns'}
          {campaignsView === CampaignsView.MY && 'My Campaigns'}
        </Typography>
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          ml={1}
          width={24} 
          height={24} 
          borderRadius="100%" 
          border="1px solid rgba(255, 255, 255, 0.1)"
          bgcolor="background.default"
        >
          <ArrowDownIcon
            sx={{
              color: 'text.primary',
              width: 24,
              height: 24,
              transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out',
            }}
          />
        </Box>
      </Button>
      <Menu
        id="campaigns-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              mt: 1,
              borderRadius: '4px',
              bgcolor: 'background.default',
            },
          },
          list: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }
          },
        }}
      >
        <MenuItem onClick={() => handleMenuItemClick(CampaignsView.ALL)}>
          All Campaigns
        </MenuItem>
        <MenuItem disabled={!isAuthenticated} onClick={() => handleMenuItemClick(CampaignsView.JOINED)}>
          Joined Campaigns
        </MenuItem>
        <MenuItem disabled={!isConnected} onClick={() => handleMenuItemClick(CampaignsView.MY)}>
          My Campaigns
        </MenuItem>
      </Menu>
    </>
  );
};

export default CampaignsViewDropdown;

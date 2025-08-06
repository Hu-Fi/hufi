import { FC, useState } from 'react';

import { Button, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { ChevronIcon } from '../../icons';

const CampaignsMenu: FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const navigate = useNavigate();

  const open = !!anchorEl;

  const handleClose = () => setAnchorEl(null);

  const handleMenuItemClick = (path: string) => {
    handleClose();
    navigate(path);
  };

  return (
    <>
      <Button
        variant="text"
        size="medium"
        aria-controls={open ? 'campaigns-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        Campaigns
        <ChevronIcon
          sx={{
            ml: 1,
            transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out',
          }}
        />
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
              borderRadius: '10px',
              bgcolor: 'background.default',
              fontSize: '14px',
            },
          },
          list: {
            sx: {
              '& .MuiMenuItem-root': {
                fontSize: '14px',
                fontWeight: 600,
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleMenuItemClick('/all-campaigns')}>
          All Campaigns
        </MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('/my-campaigns')}>
          My Campaigns
        </MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('/joined-campaigns')}>
          Joined Campaigns
        </MenuItem>
      </Menu>
    </>
  );
};

export default CampaignsMenu;

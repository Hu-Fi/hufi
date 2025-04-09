import { FC, useState } from "react";

import { Button, Menu, MenuItem } from "@mui/material";

import { ChevronIcon } from "../../icons";

const CampaignsMenu: FC = () => {
	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
	const open = !!anchorEl;

	const handleClose = () => setAnchorEl(null);

	return (
		<>
			<Button 
				variant="text" 
				size="medium" 
				sx={{ color: "primary.main", fontWeight: 600 }}
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
				<MenuItem onClick={handleClose}>All Campaigns</MenuItem>
				<MenuItem onClick={handleClose}>My Campaigns</MenuItem>
				<MenuItem onClick={handleClose}>Joined Campaigns</MenuItem>
			</Menu>
		</>
	)
};

export default CampaignsMenu;
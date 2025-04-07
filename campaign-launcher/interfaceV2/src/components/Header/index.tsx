import { FC } from "react";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material"
import { Link } from "react-router-dom";

import Container from "../Container";
import logo from "../../assets/logo.svg";

const Header: FC = () => {
	return (
		<AppBar 
      position="static" 
      elevation={0} 
      sx={{ 
        bgcolor: 'background.default', 
        boxShadow: 'none', 
        width: "100%",
        '& .MuiToolbar-root': {
          px: 0,
        }
      }}
    >
      <Container>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '90px', py: 3 }}>
          <Link to="/">
            <img src={logo} alt="HuFi" width={87} height={32} />
          </Link>
          <Box display="flex" gap={2} alignItems="center">
            <Typography>
              Dashboard
            </Typography>
            <Typography>
              Campaigns
            </Typography>
            <Button variant="text" size="medium" sx={{ color: "primary.main" }}>
              Stake HMT
            </Button>
            <Button variant="outlined" size="large" sx={{ color: "primary.main" }}>
              Launch Campaign
            </Button>
            <Button variant="contained" size="large" sx={{ color: "primary.contrast" }}>
              Connect Wallet
            </Button>
          </Box>
        </Toolbar>
      </Container>
			
		</AppBar>
	)
}       

export default Header;
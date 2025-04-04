import { FC } from "react";
import { Box, IconButton, Link, styled, Typography } from "@mui/material";
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import TelegramIcon from '@mui/icons-material/Telegram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

import Container from "../Container";
import { DiscordIcon } from "../../icons";

const SocialMediaIconButton = styled(IconButton)(({ theme }) => ({
	padding: 0,
	'& svg': {
		fill: theme.palette.text.primary,
		fillOpacity: 0.7,
	},

	'&:hover': {
		background: 'none',
		'& svg': {
			fill: theme.palette.text.primary,
			fillOpacity: 1,
		},
	},
}));

const StyledLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.text.secondary,
  opacity: 0.7,

  '&:hover > span': {
    color: theme.palette.text.primary,
  },
}));

const Footer: FC = () => {
	return (
		<Box component="footer" sx={{ bgcolor: 'background.default' }}>
			<Container>
				<Box
					display="flex"
					justifyContent="space-between"
					alignItems="center"
					py={4}
				>
					<Box display="flex" flexDirection="column" gap="18px">
            <Box display="flex" alignItems="center" gap={3}>
              <StyledLink href="https://www.humanprotocol.org/privacy-policy" target="_blank">
                <Typography color="text.secondary" variant="caption">
                  Privacy Policy
                </Typography>
              </StyledLink>
              <StyledLink href="https://www.humanprotocol.org/privacy-policy" target="_blank">
                <Typography color="text.secondary" variant="caption">
                  Terms of Service
                </Typography>
              </StyledLink>
              <StyledLink href="https://www.humanprotocol.org" target="_blank">
                <Typography color="text.secondary" variant="caption">
                  HUMAN Protocol
                </Typography>
              </StyledLink>
            </Box>
            <Typography color="text.secondary" variant="caption">
              © {new Date().getFullYear()} HuFi powered by HUMAN Protocol
            </Typography>
					</Box>
					<Box display="flex" alignItems="center" gap="30px">
						<SocialMediaIconButton aria-label="GitHub">
							<GitHubIcon />
						</SocialMediaIconButton>
						<SocialMediaIconButton aria-label="Discord">
							<DiscordIcon />
						</SocialMediaIconButton>
						<SocialMediaIconButton aria-label="X">
							<TwitterIcon />
						</SocialMediaIconButton>
						<SocialMediaIconButton aria-label="Telegram">
							<TelegramIcon />
						</SocialMediaIconButton>
						<SocialMediaIconButton aria-label="LinkedIn">
							<LinkedInIcon />
						</SocialMediaIconButton>
					</Box>
				</Box>
			</Container>
		</Box>
	)
}

export default Footer;
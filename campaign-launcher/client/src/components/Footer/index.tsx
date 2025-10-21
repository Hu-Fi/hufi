import type { FC } from 'react';

import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Box, IconButton, Link, styled, Typography } from '@mui/material';

import Container from '@/components/Container';
import { DiscordIcon } from '@/icons';

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

const handleClickOnSocialButton = (url: string) => {
  window.open(url, '_blank');
};

const Footer: FC = () => {
  return (
    <Box component="footer" sx={{ bgcolor: 'background.default' }}>
      <Container>
        <Box
          display="flex"
          justifyContent="space-between"
          flexDirection={{ xs: 'column-reverse', md: 'row' }}
          alignItems="center"
          py={4}
          gap={{ xs: 2, md: 0 }}
        >
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="center" gap={3}>
              <StyledLink
                href="https://www.humanprotocol.org/privacy-policy"
                target="_blank"
              >
                <Typography color="text.secondary" variant="caption">
                  Privacy Policy
                </Typography>
              </StyledLink>
              <StyledLink
                href="https://www.humanprotocol.org/privacy-policy"
                target="_blank"
              >
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
          <Box
            display="flex"
            alignItems="center"
            gap="30px"
            width={{ xs: '100%', md: 'auto' }}
            justifyContent={{ xs: 'space-between', md: 'center' }}
          >
            <SocialMediaIconButton
              aria-label="GitHub"
              onClick={() =>
                handleClickOnSocialButton(
                  import.meta.env.VITE_FOOTER_LINK_GITHUB
                )
              }
            >
              <GitHubIcon />
            </SocialMediaIconButton>
            <SocialMediaIconButton
              aria-label="Discord"
              onClick={() =>
                handleClickOnSocialButton(
                  import.meta.env.VITE_FOOTER_LINK_DISCORD
                )
              }
            >
              <DiscordIcon />
            </SocialMediaIconButton>
            <SocialMediaIconButton
              aria-label="X"
              onClick={() =>
                handleClickOnSocialButton(import.meta.env.VITE_FOOTER_LINK_X)
              }
            >
              <TwitterIcon />
            </SocialMediaIconButton>
            <SocialMediaIconButton
              aria-label="Telegram"
              onClick={() =>
                handleClickOnSocialButton(
                  import.meta.env.VITE_FOOTER_LINK_TELEGRAM
                )
              }
            >
              <TelegramIcon />
            </SocialMediaIconButton>
            <SocialMediaIconButton
              aria-label="LinkedIn"
              onClick={() =>
                handleClickOnSocialButton(
                  import.meta.env.VITE_FOOTER_LINK_LINKEDIN
                )
              }
            >
              <LinkedInIcon />
            </SocialMediaIconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

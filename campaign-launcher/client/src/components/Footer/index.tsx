import type { FC } from 'react';

import GitHubIcon from '@mui/icons-material/GitHub';
import TelegramIcon from '@mui/icons-material/Telegram';
import XIcon from '@mui/icons-material/X';
import { Box, IconButton, Stack, styled, Typography } from '@mui/material';

import Container from '@/components/Container';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '@/constants';

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

const handleClickOnSocialButton = (url: string) => {
  window.open(url, '_blank');
};

const Footer: FC<{ reserveBottomOffset: boolean }> = ({
  reserveBottomOffset,
}) => {
  return (
    <Box
      component="footer"
      bgcolor="background.default"
      pb={reserveBottomOffset ? `${MOBILE_BOTTOM_NAV_HEIGHT}px` : 0}
    >
      <Container>
        <Stack
          alignItems="center"
          pt={1}
          pb={3}
          gap={1}
          borderTop="1px solid #433679"
        >
          <Typography color="text.secondary" variant="caption">
            © {new Date().getFullYear()} HuFi powered by HUMAN Protocol
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            gap="30px"
            width={{ xs: '100%', md: 'auto' }}
            justifyContent="center"
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
              aria-label="X"
              onClick={() =>
                handleClickOnSocialButton(import.meta.env.VITE_FOOTER_LINK_X)
              }
            >
              <XIcon />
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
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;

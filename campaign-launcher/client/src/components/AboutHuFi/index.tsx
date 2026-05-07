import { type FC } from 'react';

import { Link, Stack, Typography } from '@mui/material';

import logo from '@/assets/logo.svg';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { ArrowLeftIcon } from '@/icons';

const DOCS_URL = import.meta.env.VITE_APP_DOCS_URL;

const AboutHuFi: FC = () => {
  const isMobile = useIsMobile();

  return (
    <Stack
      sx={{
        gap: { xs: 2, md: 3 },
      }}
    >
      <Typography
        variant={isMobile ? 'h6' : 'h5'}
        sx={{
          color: 'white',
          fontWeight: { xs: 500, md: 800 },
          letterSpacing: { xs: '0px', md: '-0.5px' },
        }}
      >
        About HuFi
      </Typography>
      <Stack
        sx={{
          px: 2,
          py: { xs: 2, md: 4 },
          borderRadius: '8px',
          border: '1px solid #433679',
          bgcolor: '#251d47',
        }}
      >
        {!isMobile && <img src={logo} alt="HuFi" width={125} />}
        <Typography
          variant="body2"
          sx={{
            color: 'white',
            fontWeight: 600,
            mt: { xs: 0, md: 4 },
            mb: 2,
          }}
        >
          HuFi is a decentralized tradeathon organizing platform where
          communities earn rewards for holding, trading, and contributing to
          activities that support the token&apos;s growth.
        </Typography>
        <Link
          href={DOCS_URL}
          target="_blank"
          rel="noreferrer"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            width: 'fit-content',
            color: 'error.main',
            fontSize: 16,
            fontWeight: 500,
            textDecoration: 'underline',
            textDecorationColor: 'error.main',
          }}
        >
          Learn More
          <ArrowLeftIcon
            sx={{ width: 24, height: 24, transform: 'rotate(135deg)' }}
          />
        </Link>
      </Stack>
    </Stack>
  );
};

export default AboutHuFi;

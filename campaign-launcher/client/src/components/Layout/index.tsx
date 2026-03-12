import { type FC, type PropsWithChildren, useEffect } from 'react';

import { Box } from '@mui/material';
import { useLocation } from 'react-router';

import Container from '@/components/Container';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { ROUTES } from '@/constants';
import { useIsMobile } from '@/hooks/useBreakpoints';

const Layout: FC<PropsWithChildren> = ({ children }) => {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();

  const showMobileBottomNav =
    isMobile &&
    (pathname === ROUTES.DASHBOARD || pathname === ROUTES.CAMPAIGNS);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Box minHeight="100dvh" width="100%" bgcolor="background.default">
      <Header />
      <Container component="main">{children}</Container>
      <Footer showMobileBottomNav={showMobileBottomNav} />
      <MobileBottomNav isVisible={showMobileBottomNav} />
    </Box>
  );
};

export default Layout;

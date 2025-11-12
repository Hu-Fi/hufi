import { type FC, type PropsWithChildren, useEffect } from 'react';

import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

import Container from '@/components/Container';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const Layout: FC<PropsWithChildren> = ({ children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Box minHeight="100dvh" width="100%" bgcolor="background.default">
      <Header />
      <Container component="main">{children}</Container>
      <Footer />
    </Box>
  );
};

export default Layout;

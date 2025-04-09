import { FC, PropsWithChildren } from 'react';

import { Box } from '@mui/material';

import Container from '../Container';
import Footer from '../Footer';
import Header from '../Header';

const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box minHeight="100dvh" width="100%" bgcolor="background.default">
      <Header />
      <Container>
        <main>{children}</main>
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;

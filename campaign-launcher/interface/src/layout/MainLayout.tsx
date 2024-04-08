import { Box } from '@mui/material';
import { FC, PropsWithChildren } from 'react';

import { Footer } from './Footer';
import { Header } from './Header';
import { PageWrapper } from './PageWrapper';

export const MainLayout: FC<PropsWithChildren<{}>> = ({ children }) => (
  <Box>
    <Header />
    <PageWrapper>{children}</PageWrapper>
    <Footer />
  </Box>
);

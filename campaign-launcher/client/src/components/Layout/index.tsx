import {
  createContext,
  type Dispatch,
  type FC,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Box } from '@mui/material';
import { useLocation } from 'react-router';

import Container from '@/components/Container';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const LayoutBottomOffsetContext = createContext<Dispatch<
  SetStateAction<boolean>
> | null>(null);

export const useReserveLayoutBottomOffset = (enabled: boolean) => {
  const setReserveBottomOffset = useContext(LayoutBottomOffsetContext);

  if (!setReserveBottomOffset) {
    throw new Error(
      'useReserveLayoutBottomOffset must be used within Layout provider'
    );
  }

  useEffect(() => {
    setReserveBottomOffset(enabled);

    return () => {
      setReserveBottomOffset(false);
    };
  }, [enabled, setReserveBottomOffset]);
};

const Layout: FC<PropsWithChildren> = ({ children }) => {
  const [reserveBottomOffset, setReserveBottomOffset] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Box minHeight="100dvh" width="100%" bgcolor="background.default">
      <Header />
      <LayoutBottomOffsetContext.Provider value={setReserveBottomOffset}>
        <Container component="main">{children}</Container>
      </LayoutBottomOffsetContext.Provider>
      <Footer reserveBottomOffset={reserveBottomOffset} />
    </Box>
  );
};

export default Layout;

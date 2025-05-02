import { FC } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import { ROUTES } from './constants';
import Dashboard from './pages/Dashboard';
import ExchangesProvider from './providers/ExchangesProvider';
import QueryClientProvider from './providers/QueryClientProvider';
import ThemeProvider from './providers/ThemeProvider';
import WagmiProvider from './providers/WagmiProvider';

const App: FC = () => {
  return (
    <WagmiProvider>
      <QueryClientProvider>
        <ExchangesProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ThemeProvider>
              <BrowserRouter>
                <Layout>
                  <Routes>
                    <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                  </Routes>
                </Layout>
              </BrowserRouter>
            </ThemeProvider>
          </LocalizationProvider>
        </ExchangesProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;

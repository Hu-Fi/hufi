import { FC } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import { ROUTES } from './constants';
import AllCampaignsPage from './pages/AllCampaigns';
import Campaign from './pages/Campaign';
import Dashboard from './pages/Dashboard';
import JoinedCampaignsPage from './pages/JoinedCampaigns';
import MyCampaignsPage from './pages/MyCampaigns';
import ExchangesProvider from './providers/ExchangesProvider';
import QueryClientProvider from './providers/QueryClientProvider';
import ThemeProvider from './providers/ThemeProvider';
import WagmiProvider from './providers/WagmiProvider';
import { Web3AuthProvider } from './providers/Web3AuthProvider';

const App: FC = () => {
  return (
    <WagmiProvider>
      <QueryClientProvider>
        <Web3AuthProvider>
          <ExchangesProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <ThemeProvider>
                <BrowserRouter>
                  <Layout>
                    <Routes>
                      <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                      <Route
                        path={ROUTES.CAMPAIGN_DETAIL}
                        element={<Campaign />}
                      />
                      <Route
                        path={ROUTES.ALL_CAMPAIGNS}
                        element={<AllCampaignsPage />}
                      />
                      <Route
                        path={ROUTES.MY_CAMPAIGNS}
                        element={<MyCampaignsPage />}
                      />
                      <Route
                        path={ROUTES.JOINED_CAMPAIGNS}
                        element={<JoinedCampaignsPage />}
                      />
                    </Routes>
                  </Layout>
                </BrowserRouter>
              </ThemeProvider>
            </LocalizationProvider>
          </ExchangesProvider>
        </Web3AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;

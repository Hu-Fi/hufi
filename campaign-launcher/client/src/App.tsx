import type { FC } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ROUTES } from '@/constants';
import Campaign from '@/pages/Campaign';
import Dashboard from '@/pages/Dashboard';
import ManageApiKeysPage from '@/pages/ManageApiKeys';
import ActiveAccountProvider from '@/providers/ActiveAccountProvider';
import ExchangesProvider from '@/providers/ExchangesProvider';
import { NetworkProvider } from '@/providers/NetworkProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import QueryClientProvider from '@/providers/QueryClientProvider';
import StakeProvider from '@/providers/StakeProvider';
import ThemeProvider from '@/providers/ThemeProvider';
import WagmiProvider from '@/providers/WagmiProvider';
import { Web3AuthProvider } from '@/providers/Web3AuthProvider';

const App: FC = () => {
  return (
    <WagmiProvider>
      <QueryClientProvider>
        <ThemeProvider>
          <NotificationProvider>
            <NetworkProvider>
              <ActiveAccountProvider>
                <Web3AuthProvider>
                  <ExchangesProvider>
                    <StakeProvider>
                      <LocalizationProvider
                        dateAdapter={AdapterDayjs}
                        adapterLocale="en"
                      >
                        <BrowserRouter>
                          <Layout>
                            <Routes>
                              <Route
                                path={ROUTES.DASHBOARD}
                                element={<Dashboard />}
                              />
                              <Route
                                path={ROUTES.CAMPAIGN_DETAILS}
                                element={<Campaign />}
                              />
                              <Route
                                path={ROUTES.MANAGE_API_KEYS}
                                element={
                                  <ProtectedRoute>
                                    <ManageApiKeysPage />
                                  </ProtectedRoute>
                                }
                              />
                            </Routes>
                          </Layout>
                        </BrowserRouter>
                      </LocalizationProvider>
                    </StakeProvider>
                  </ExchangesProvider>
                </Web3AuthProvider>
              </ActiveAccountProvider>
            </NetworkProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;

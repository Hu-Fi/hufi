import { FC } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthenticationProvider as ROAuthenticationProvider } from './hooks/recording-oracle';
import { MainLayout } from './layout';
import {
  ApiProvider,
  NotificationProvider,
  QueryClientProvider,
  ThemeProvider,
  WagmiProvider,
} from './providers';
import { ROUTES } from './routes';

export const App: FC = () => {
  return (
    <WagmiProvider>
      <QueryClientProvider>
        <ApiProvider>
          <ROAuthenticationProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <ThemeProvider>
                <NotificationProvider>
                  <Router>
                    <MainLayout>
                      <Routes>
                        {ROUTES.map((route) => (
                          <Route
                            key={route.key}
                            path={route.path}
                            element={<route.component />}
                          />
                        ))}
                      </Routes>
                    </MainLayout>
                  </Router>
                </NotificationProvider>
              </ThemeProvider>
            </LocalizationProvider>
          </ROAuthenticationProvider>
        </ApiProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

import { FC } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import { ROUTES } from './constants';
import Dashboard from './pages/Dashboard';
import { QueryClientProvider } from './providers/QueryClientProvider';
import ThemeProvider from './providers/ThemeProvider';
import { WagmiProvider } from './providers/WagmiProvider';

const App: FC = () => {
  return (
    <WagmiProvider>
      <QueryClientProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;

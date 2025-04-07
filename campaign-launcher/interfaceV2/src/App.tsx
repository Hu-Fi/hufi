import { FC } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import ThemeProvider from './providers/ThemeProvider';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import { ROUTES } from './constants';

const App: FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

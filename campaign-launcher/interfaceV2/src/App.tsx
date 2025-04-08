import { FC } from 'react'

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import { ROUTES } from './constants';
import Dashboard from './pages/Dashboard';
import ThemeProvider from './providers/ThemeProvider';

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

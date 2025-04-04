import { FC } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ThemeProvider from './providers/ThemeProvider';
import Layout from './components/Layout';

const App: FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

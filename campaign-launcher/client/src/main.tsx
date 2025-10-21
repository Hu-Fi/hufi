import { createRoot } from 'react-dom/client';

import App from './App.tsx';

const initDebugger = () => {
  const script = document.createElement('script');
  script.src = '//cdn.jsdelivr.net/npm/eruda';
  document.body.appendChild(script);
  script.onload = () => {
    // @ts-expect-error this is for dev purpose only
    window.eruda.init();
  };
};

if (/iPhone|Android/i.test(navigator.userAgent)) {
  initDebugger();
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);

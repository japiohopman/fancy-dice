import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const viteEnv = (import.meta as any).env;

// Install the offline app shell only in production builds. BASE_URL is
// /fancy-dice/ on GitHub Pages and / for local or root-hosted deployments.
if (viteEnv.PROD && 'serviceWorker' in navigator) {
  window.addEventListener(
    'load',
    () => {
      navigator.serviceWorker
        .register(`${viteEnv.BASE_URL}sw.js`, {scope: viteEnv.BASE_URL})
        .catch((error) => {
          console.error('Fancy Dice service worker registration failed:', error);
        });
    },
    {once: true},
  );
}

performance.mark('fancy-dice:app-entry');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

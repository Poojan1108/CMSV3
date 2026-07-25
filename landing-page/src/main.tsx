import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {AppProvider} from './core/store';
import App from './App.tsx';
import './styles/main.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);

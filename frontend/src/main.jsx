import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { SectionVisibilityProvider } from './services/api/SectionVisibility';
import { initContentLanguage } from './services/api/publicContentLanguage';
import './styles/global.css';
import './motion/motion.css';
import './styles/refined-dark.css';

initContentLanguage();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SectionVisibilityProvider><App /></SectionVisibilityProvider>
    </BrowserRouter>
  </React.StrictMode>
);

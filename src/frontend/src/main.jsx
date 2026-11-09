/**
 * main.jsx — Ponto de entrada da aplicação UNISpace (P1.3)
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/global.css';
import './styles/components.css';

import { App } from './App.jsx';

const raiz = document.getElementById('root');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>
);

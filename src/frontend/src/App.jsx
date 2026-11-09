/**
 * App.jsx — Raiz da aplicação UNISpace (P1.3)
 *
 * Monta o AuthProvider e o BrowserRouter, encapsulando todas as rotas.
 */
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

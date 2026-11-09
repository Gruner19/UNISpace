/**
 * AppRoutes.jsx — Configuração de rotas do UNISpace (P1.3)
 *
 * Define as rotas públicas e protegidas da aplicação.
 * Novas rotas (T5.2, T6.3, T7.2, etc.) serão adicionadas aqui conforme
 * as sub-issues forem implementadas.
 */
import { Routes, Route, Navigate } from 'react-router-dom';

import { RutaProtegida } from './RutaProtegida';
import { LoginPage } from '../pages/LoginPage';
import { AgendaPage } from '../pages/AgendaPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Rota raiz → redireciona para a agenda (ou login se não autenticado) */}
      <Route path="/" element={<Navigate to="/agenda" replace />} />

      {/* Rota pública: login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas protegidas */}
      <Route
        path="/agenda"
        element={
          <RutaProtegida>
            <AgendaPage />
          </RutaProtegida>
        }
      />

      {/* Fallback para rotas não encontradas */}
      <Route path="*" element={<Navigate to="/agenda" replace />} />
    </Routes>
  );
}

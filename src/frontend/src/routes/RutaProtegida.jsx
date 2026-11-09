/**
 * RutaProtegida.jsx — Rota que exige autenticação (P1.3)
 *
 * Redireciona para /login se o usuário não estiver autenticado,
 * preservando a URL de origem em `location.state.from` para
 * redirecionar de volta após o login.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children - Conteúdo protegido
 */
export function RutaProtegida({ children }) {
  const { autenticado } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

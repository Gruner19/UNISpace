/**
 * LoginPage.jsx — Tela de Autenticação Institucional UNISpace (T01 / P1.3)
 *
 * Design moderno com background em degradê azul escuro / azul elétrico / violeta,
 * tarjeta central branca de alta fidelidade visual, responsivo e polido.
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { LoginForm } from '../features/auth/LoginForm';
import { WaterRippleEffect } from '../components/common/WaterRippleEffect';

import '../styles/login.css';

export function LoginPage() {
  const { autenticado } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redireciona se o usuário já estiver autenticado
  useEffect(() => {
    if (autenticado) {
      const destino = location.state?.from?.pathname || '/agenda';
      navigate(destino, { replace: true });
    }
  }, [autenticado, navigate, location]);

  if (autenticado) return null;

  return (
    <main className="login-page" aria-label="Página de login UNISpace">
      {/* Efecto interactivo de agua / ondas en el fondo */}
      <WaterRippleEffect />

      <div className="login-card-container">
        <section className="login-card">
          
          {/* Top Brand Header */}
          <div className="login-brand">
            <h1 className="login-brand__title">Bem-vindo ao UNIspace</h1>
            <p className="login-brand__subtitle">
              Acesse sua conta institucional para continuar
            </p>
          </div>

          {/* Formulário Interativo */}
          <LoginForm />

          {/* Dica de Domínio Institucional */}
          <aside className="institutional-badge" aria-label="Informação institucional">
            <svg
              className="institutional-badge__icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>
              Acesso exclusivo para discentes e docentes cadastrados (ex.: <code>@ufop.edu.br</code> ou <code>@unitru.edu.pe</code>).
            </span>
          </aside>
        </section>

        {/* Rodapé Discreto e Institucional */}
        <footer className="login-footer">
          <p className="login-footer__text">
            © {new Date().getFullYear()} UNIspace — Sistema de Gestão e Reserva de Espaços
          </p>
          <p className="login-footer__subtext">
            Plataforma Acadêmica Centralizada
          </p>
        </footer>
      </div>
    </main>
  );
}

/**
 * AgendaPage.jsx — Página de agenda (placeholder para T02 / P1.3)
 *
 * Esta é a tela de destino após o login (T02 — Consulta de Disponibilidade).
 * O conteúdo completo será implementado em T5.2.
 * Esta versão exibe a estrutura mínima para validar o fluxo de redirecionamento.
 */
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/** Estilos inline mínimos para o placeholder */
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-bg)',
  },
  header: {
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '-0.025em',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userInfo: {
    fontSize: '0.875rem',
    opacity: 0.9,
  },
  logoutBtn: {
    padding: '0.375rem 0.875rem',
    backgroundColor: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '0.375rem',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  main: {
    flex: 1,
    padding: '2rem 1.5rem',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.25rem 0.75rem',
    backgroundColor: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: '1px solid #6ee7b7',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 800,
    color: 'var(--color-text-primary)',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: 'var(--color-text-secondary)',
    marginBottom: '2rem',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.75rem',
    padding: '2rem',
    textAlign: 'center',
    color: 'var(--color-text-secondary)',
  },
  cardIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    marginBottom: '0.5rem',
  },
};

export function AgendaPage() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  const handleSair = () => {
    sair();
    navigate('/login', { replace: true });
  };

  const perfilLabel =
    usuario?.perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Estudante';

  return (
    <div style={styles.page}>
      {/* Barra de navegação */}
      <header style={styles.header}>
        <span style={styles.brand}>🏛️ UNISpace</span>
        <nav style={styles.nav}>
          <span style={styles.userInfo}>
            {usuario?.nome} · {perfilLabel}
          </span>
          <button style={styles.logoutBtn} onClick={handleSair}>
            Sair
          </button>
        </nav>
      </header>

      {/* Conteúdo principal */}
      <main style={styles.main}>
        <div style={styles.badge}>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Login realizado com sucesso
        </div>

        <h1 style={styles.title}>Agenda de Espaços</h1>
        <p style={styles.subtitle}>
          Bem-vindo(a), <strong>{usuario?.nome}</strong>! Consulte a disponibilidade
          e reserve o espaço que precisar.
        </p>

        {/* Placeholder — T02 (T5.2) implementará o conteúdo real */}
        <div style={styles.card}>
          <div style={styles.cardIcon}>📅</div>
          <p style={styles.cardTitle}>Agenda em desenvolvimento</p>
          <p>
            A tela completa de consulta de disponibilidade (T02) será
            implementada na sub-issue <strong>T5.2</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}

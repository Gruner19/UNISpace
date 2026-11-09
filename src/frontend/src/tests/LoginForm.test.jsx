/**
 * LoginForm.test.jsx — Testes de integração do formulário de login (P1.3)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';

// ---------------------------------------------------------------------------
// Mock do authService para controlar respostas nos testes
// ---------------------------------------------------------------------------

vi.mock('../services/authService', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    login: vi.fn(),
    persistirSessao: vi.fn(),
    recuperarSessao: vi.fn(() => null),
    tokenValido: vi.fn(() => false),
    logout: vi.fn(),
  };
});

import { login as loginMock, persistirSessao } from '../services/authService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function PaginaAgendaFake() {
  return <div data-testid="pagina-agenda">Agenda</div>;
}

function renderLogin(entradaInicial = '/login') {
  return render(
    <MemoryRouter initialEntries={[entradaInicial]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/agenda" element={<PaginaAgendaFake />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe('LoginPage — renderização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exibe o título da marca UNIspace', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /Bem-vindo ao UNIspace/i })).toBeInTheDocument();
  });

  it('exibe o campo de e-mail institucional', () => {
    renderLogin();
    expect(screen.getByLabelText(/e-mail institucional/i)).toBeInTheDocument();
  });

  it('exibe o campo de senha', () => {
    renderLogin();
    expect(screen.getByLabelText(/^senha/i)).toBeInTheDocument();
  });

  it('exibe o botão de entrar', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /entrar no sistema/i })).toBeInTheDocument();
  });

  it('exibe o link "Esqueci minha senha"', () => {
    renderLogin();
    expect(screen.getByText(/esqueci minha senha/i)).toBeInTheDocument();
  });
});

describe('LoginForm — validação de campos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mostra erro de e-mail obrigatório ao sair do campo vazio', async () => {
    const user = userEvent.setup();
    renderLogin();
    const emailInput = screen.getByLabelText(/e-mail institucional/i);
    await user.click(emailInput);
    await user.tab();
    await waitFor(() => {
      expect(screen.getByText(/e-mail é obrigatório/i)).toBeInTheDocument();
    });
  });

  it('mostra erro de domínio não institucional', async () => {
    const user = userEvent.setup();
    renderLogin();
    const emailInput = screen.getByLabelText(/e-mail institucional/i);
    await user.type(emailInput, 'usuario@gmail.com');
    await user.tab();
    await waitFor(() => {
      expect(screen.getByText(/Use o seu e-mail institucional/i)).toBeInTheDocument();
    });
  });

  it('não mostra erro para e-mail institucional válido', async () => {
    const user = userEvent.setup();
    renderLogin();
    const emailInput = screen.getByLabelText(/e-mail institucional/i);
    await user.type(emailInput, 'demo@aluno.ufop.edu.br');
    await user.tab();
    await waitFor(() => {
      expect(screen.queryByText(/Use o seu e-mail institucional/i)).not.toBeInTheDocument();
    });
  });

  it('mostra erro de senha obrigatória ao sair do campo vazio', async () => {
    const user = userEvent.setup();
    renderLogin();
    const senhaInput = screen.getByLabelText(/^senha/i);
    await user.click(senhaInput);
    await user.tab();
    await waitFor(() => {
      expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
    });
  });

  it('mostra erro de senha muito curta', async () => {
    const user = userEvent.setup();
    renderLogin();
    const senhaInput = screen.getByLabelText(/^senha/i);
    await user.type(senhaInput, '123');
    await user.tab();
    await waitFor(() => {
      expect(screen.getByText(/pelo menos 6 caracteres/i)).toBeInTheDocument();
    });
  });

  it('o botão fica desabilitado enquanto os campos estão vazios', () => {
    renderLogin();
    const btn = screen.getByRole('button', { name: /entrar no sistema/i });
    expect(btn).toBeDisabled();
  });
});

describe('LoginForm — toggle de senha', () => {
  it('alterna a visibilidade da senha ao clicar no botão', async () => {
    const user = userEvent.setup();
    renderLogin();
    const senhaInput = screen.getByLabelText(/^senha/i);
    expect(senhaInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /mostrar senha/i });
    await user.click(toggleBtn);
    expect(senhaInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: /ocultar senha/i }));
    expect(senhaInput).toHaveAttribute('type', 'password');
  });
});

describe('LoginForm — submissão e erro de autenticação', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exibe mensagem de erro quando as credenciais são inválidas', async () => {
    const erroLogin = new Error('Credenciais inválidas. Verifique o e-mail e a senha.');
    erroLogin.codigo = 'CREDENCIAIS_INVALIDAS';
    loginMock.mockRejectedValue(erroLogin);

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/e-mail institucional/i), 'demo@aluno.ufop.edu.br');
    await user.type(screen.getByLabelText(/^senha/i), 'errada123');
    await user.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/credenciais inválidas/i);
    });
  });

  it('redireciona para /agenda após login bem-sucedido', async () => {
    loginMock.mockResolvedValue({
      usuario: { id: 'u1', nome: 'Demo', perfil: 'ESTUDANTE' },
      token: 'tok123',
    });
    persistirSessao.mockReturnValue(undefined);

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/e-mail institucional/i), 'demo@aluno.ufop.edu.br');
    await user.type(screen.getByLabelText(/^senha/i), 'demo123');
    await user.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    await waitFor(() => {
      expect(screen.getByTestId('pagina-agenda')).toBeInTheDocument();
    });
  });
});

describe('LoginForm — acessibilidade', () => {
  it('o input de e-mail tem aria-required=true', () => {
    renderLogin();
    expect(screen.getByLabelText(/e-mail institucional/i)).toHaveAttribute('aria-required', 'true');
  });

  it('o input de senha tem aria-required=true', () => {
    renderLogin();
    expect(screen.getByLabelText(/^senha/i)).toHaveAttribute('aria-required', 'true');
  });

  it('marca aria-invalid=true quando o campo tem erro', async () => {
    const user = userEvent.setup();
    renderLogin();
    const emailInput = screen.getByLabelText(/e-mail institucional/i);
    await user.click(emailInput);
    await user.tab();
    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });
});

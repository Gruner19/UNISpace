/**
 * authService.test.js — Testes unitários do serviço de autenticação (P1.3)
 *
 * Cobre:
 *   - validarEmailInstitucional: formatos válidos e inválidos, domínios institucionais
 *   - validarSenha: campo obrigatório e comprimento mínimo
 *   - login simulado: credenciais corretas e incorretas
 *   - persistirSessao / recuperarSessao / tokenValido
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  validarEmailInstitucional,
  validarSenha,
  login,
  persistirSessao,
  recuperarSessao,
  tokenValido,
  logout,
} from '../services/authService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cria um stub do localStorage para os testes. */
function criarLocalStorageFake() {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
}

// ---------------------------------------------------------------------------
// validarEmailInstitucional
// ---------------------------------------------------------------------------

describe('validarEmailInstitucional', () => {
  it('retorna inválido para string vazia', () => {
    expect(validarEmailInstitucional('').valido).toBe(false);
  });

  it('retorna inválido para formato sem @', () => {
    expect(validarEmailInstitucional('usuariosemdominio').valido).toBe(false);
  });

  it('retorna inválido para domínio não institucional', () => {
    const r = validarEmailInstitucional('usuario@gmail.com');
    expect(r.valido).toBe(false);
    expect(r.mensagem).toMatch(/institucional/i);
  });

  it('aceita @ufop.edu.br', () => {
    expect(validarEmailInstitucional('admin@ufop.edu.br').valido).toBe(true);
  });

  it('aceita @aluno.ufop.edu.br', () => {
    expect(validarEmailInstitucional('demo@aluno.ufop.edu.br').valido).toBe(true);
  });

  it('aceita @unitru.edu.pe', () => {
    expect(validarEmailInstitucional('coord@unitru.edu.pe').valido).toBe(true);
  });

  it('aceita @universidade.br', () => {
    expect(validarEmailInstitucional('prof@universidade.br').valido).toBe(true);
  });

  it('é case-insensitive', () => {
    expect(validarEmailInstitucional('ADMIN@UFOP.EDU.BR').valido).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validarSenha
// ---------------------------------------------------------------------------

describe('validarSenha', () => {
  it('retorna inválido para string vazia', () => {
    expect(validarSenha('').valido).toBe(false);
  });

  it('retorna inválido para senha com menos de 6 caracteres', () => {
    expect(validarSenha('abcde').valido).toBe(false);
  });

  it('aceita senha com 6 caracteres', () => {
    expect(validarSenha('abc123').valido).toBe(true);
  });

  it('aceita senha longa', () => {
    expect(validarSenha('minha_senha_segura_2026').valido).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// login (modo simulado)
// ---------------------------------------------------------------------------

describe('login simulado', () => {
  it('autentica demo@aluno.ufop.edu.br com senha correta', async () => {
    const { usuario, token } = await login('demo@aluno.ufop.edu.br', 'demo123');
    expect(usuario.id).toBe('user-demo-1');
    expect(usuario.perfil).toBe('ESTUDANTE');
    expect(token).toBeTruthy();
    // Não deve vazar a senha
    expect(usuario._senha).toBeUndefined();
  });

  it('autentica admin@ufop.edu.br com senha correta', async () => {
    const { usuario } = await login('admin@ufop.edu.br', 'admin123');
    expect(usuario.perfil).toBe('ADMINISTRADOR');
  });

  it('é case-insensitive no e-mail', async () => {
    const { usuario } = await login('DEMO@ALUNO.UFOP.EDU.BR', 'demo123');
    expect(usuario.id).toBe('user-demo-1');
  });

  it('lança erro para senha incorreta', async () => {
    await expect(login('demo@aluno.ufop.edu.br', 'errada')).rejects.toThrow();
  });

  it('lança erro para e-mail não cadastrado', async () => {
    await expect(login('nao@ufop.edu.br', 'qualquer')).rejects.toThrow();
  });

  it('o erro tem código CREDENCIAIS_INVALIDAS', async () => {
    try {
      await login('demo@aluno.ufop.edu.br', 'errada');
    } catch (e) {
      expect(e.codigo).toBe('CREDENCIAIS_INVALIDAS');
    }
  });
});

// ---------------------------------------------------------------------------
// persistirSessao / recuperarSessao / tokenValido / logout
// ---------------------------------------------------------------------------

describe('gerenciamento de sessão', () => {
  let lsFake;

  beforeEach(() => {
    lsFake = criarLocalStorageFake();
    vi.stubGlobal('localStorage', lsFake);
  });

  it('persistirSessao e recuperarSessao devolvem os mesmos dados', () => {
    const sessao = {
      usuario: { id: 'u1', nome: 'Teste' },
      token: 'tok123',
    };
    persistirSessao(sessao);
    const recuperada = recuperarSessao();
    expect(recuperada.token).toBe('tok123');
    expect(recuperada.usuario.id).toBe('u1');
  });

  it('recuperarSessao retorna null se não houver dados', () => {
    expect(recuperarSessao()).toBeNull();
  });

  it('logout remove os dados do storage', () => {
    persistirSessao({ usuario: { id: 'u1' }, token: 'tok' });
    logout();
    expect(recuperarSessao()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// tokenValido
// ---------------------------------------------------------------------------

describe('tokenValido', () => {
  it('retorna false para token nulo', () => {
    expect(tokenValido(null)).toBe(false);
  });

  it('retorna false para string vazia', () => {
    expect(tokenValido('')).toBe(false);
  });

  it('valida token simulado não expirado', async () => {
    const { token } = await login('demo@aluno.ufop.edu.br', 'demo123');
    expect(tokenValido(token)).toBe(true);
  });

  it('considera token não-simulado como válido (validação pelo servidor)', () => {
    // Tokens reais são opacos para o frontend; valida-se pelo backend
    expect(tokenValido('eyJhbGciOiJIUzI1NiJ9.xxx.yyy')).toBe(true);
  });
});

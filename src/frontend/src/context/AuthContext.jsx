/**
 * AuthContext.jsx — Contexto de autenticação do UNISpace (P1.3)
 *
 * Provê o estado de autenticação e as ações login/logout para toda a árvore
 * de componentes. Persiste a sessão no localStorage para sobreviver a reloads.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  login as loginService,
  logout as logoutService,
  persistirSessao,
  recuperarSessao,
  tokenValido,
} from '../services/authService';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Sessao
 * @property {Object|null} usuario - Dados do usuário autenticado
 * @property {string|null} token   - JWT de acesso
 */

/**
 * AuthProvider — envolve a aplicação e disponibiliza o contexto de auth.
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  /** @type {[Sessao, Function]} */
  const [sessao, setSessao] = useState(() => {
    const salva = recuperarSessao();
    if (salva && tokenValido(salva.token)) return salva;
    logoutService(); // limpa dados inválidos/expirados
    return { usuario: null, token: null };
  });

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  /**
   * Realiza o login e persiste a sessão.
   * @param {string} email
   * @param {string} senha
   * @returns {Promise<void>}
   */
  const entrar = useCallback(async (email, senha) => {
    setCarregando(true);
    setErro(null);

    try {
      const { usuario, token } = await loginService(email, senha);
      persistirSessao({ usuario, token });
      setSessao({ usuario, token });
    } catch (e) {
      setErro(e.message || 'Erro ao tentar entrar. Tente novamente.');
      throw e; // Re-lança para o formulário tratar localmente se necessário
    } finally {
      setCarregando(false);
    }
  }, []);

  /**
   * Encerra a sessão do usuário.
   */
  const sair = useCallback(() => {
    logoutService();
    setSessao({ usuario: null, token: null });
    setErro(null);
  }, []);

  /** Limpa o erro de autenticação. */
  const limparErro = useCallback(() => setErro(null), []);

  const autenticado = Boolean(sessao.usuario);

  const valor = useMemo(
    () => ({
      usuario: sessao.usuario,
      token: sessao.token,
      autenticado,
      carregando,
      erro,
      entrar,
      sair,
      limparErro,
    }),
    [sessao, autenticado, carregando, erro, entrar, sair, limparErro]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAuth — acessa o contexto de autenticação.
 * Deve ser usado dentro de um AuthProvider.
 *
 * @returns {{
 *   usuario: Object|null,
 *   token: string|null,
 *   autenticado: boolean,
 *   carregando: boolean,
 *   erro: string|null,
 *   entrar: (email: string, senha: string) => Promise<void>,
 *   sair: () => void,
 *   limparErro: () => void,
 * }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de um <AuthProvider>.');
  }
  return ctx;
}

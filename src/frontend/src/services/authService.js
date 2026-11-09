/**
 * authService.js — Serviço de autenticação do UNISpace (P1.3)
 *
 * Integra com o endpoint POST /api/v1/auth/login quando P1.1 estiver disponível.
 * Enquanto o backend de autenticação não estiver pronto, opera em modo de simulação
 * com os usuários do seed definidos em src/backend/src/config/seed.js.
 *
 * Para ativar o backend real: definir VITE_USE_REAL_AUTH=true no .env do frontend.
 *
 * Domínios institucionais aceitos (conforme interfaces.md e seed.js):
 *   @universidade.br, @unitru.edu.pe, @aluno.ufop.edu.br, @ufop.edu.br
 */

/** URL base da API (proxiada pelo Vite em desenvolvimento). */
const API_BASE = '/api/v1';

/** Chave usada no localStorage para persistir a sessão. */
const TOKEN_KEY = 'unispace_token';
const USER_KEY = 'unispace_user';

/**
 * Domínios institucionais válidos.
 * Fonte: docs/interfaces.md (T01) e seed.js.
 */
export const DOMINIOS_INSTITUCIONAIS = [
  'universidade.br',
  'unitru.edu.pe',
  'aluno.ufop.edu.br',
  'ufop.edu.br',
];

/**
 * Valida se um e-mail tem formato válido e domínio institucional.
 * @param {string} email
 * @returns {{ valido: boolean, mensagem?: string }}
 */
export function validarEmailInstitucional(email) {
  if (!email || !email.trim()) {
    return { valido: false, mensagem: 'O e-mail é obrigatório.' };
  }

  const trimmed = email.trim().toLowerCase();

  // Formato básico de e-mail
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(trimmed)) {
    return { valido: false, mensagem: 'Formato de e-mail inválido.' };
  }

  // Domínio institucional
  const dominio = trimmed.split('@')[1];
  const dominioValido = DOMINIOS_INSTITUCIONAIS.some(
    (d) => dominio === d || dominio.endsWith('.' + d)
  );

  if (!dominioValido) {
    return {
      valido: false,
      mensagem: `Use o seu e-mail institucional (ex.: usuario@ufop.edu.br ou usuario@unitru.edu.pe).`,
    };
  }

  return { valido: true };
}

/**
 * Valida a senha (campo obrigatório, mínimo 6 caracteres).
 * @param {string} senha
 * @returns {{ valido: boolean, mensagem?: string }}
 */
export function validarSenha(senha) {
  if (!senha) {
    return { valido: false, mensagem: 'A senha é obrigatória.' };
  }
  if (senha.length < 5) {
    return { valido: false, mensagem: 'A senha deve ter pelo menos 5 caracteres.' };
  }
  return { valido: true };
}

// ---------------------------------------------------------------------------
// Modo de simulação (usado enquanto P1.1 não está disponível)
// ---------------------------------------------------------------------------

/**
 * Usuários simulados com base no seed do backend.
 * Senhas são apenas para o modo de desenvolvimento sem backend.
 * Em produção, a autenticação é delegada inteiramente ao backend.
 */
const USUARIOS_SIMULADOS = [
  {
    id: 'user-demo-1',
    nome: 'Estudante Demonstração',
    emailInstitucional: 'demo@aluno.ufop.edu.br',
    perfil: 'ESTUDANTE',
    _senha: 'demo123',
  },
  {
    id: 'user-admin-1',
    nome: 'Administrador UNISpace',
    emailInstitucional: 'admin@ufop.edu.br',
    perfil: 'ADMINISTRADOR',
    _senha: 'admin123',
  },
];

/**
 * Simula latência de rede.
 * @param {number} ms
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Realiza login no modo simulado (sem backend).
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<{ usuario: object, token: string }>}
 */
async function loginSimulado(email, senha) {
  await delay(600); // Simula latência de rede

  const emailNorm = email.trim().toLowerCase();
  const usuario = USUARIOS_SIMULADOS.find(
    (u) => u.emailInstitucional === emailNorm
  );

  if (!usuario || usuario._senha !== senha) {
    const erro = new Error('Credenciais inválidas. Verifique o e-mail e a senha.');
    erro.codigo = 'CREDENCIAIS_INVALIDAS';
    erro.status = 401;
    throw erro;
  }

  // Gera token JWT simulado (não criptografado — apenas para dev)
  const payload = {
    sub: usuario.id,
    email: usuario.emailInstitucional,
    perfil: usuario.perfil,
    exp: Math.floor(Date.now() / 1000) + 86400, // 24h
  };
  const tokenSimulado = `sim.${btoa(JSON.stringify(payload))}`;

  const { _senha: _, ...dadosPublicos } = usuario;
  return { usuario: dadosPublicos, token: tokenSimulado };
}

/**
 * Realiza login via API real (backend P1.1).
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<{ usuario: object, token: string }>}
 */
async function loginReal(email, senha) {
  const resposta = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), senha }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    const erro = new Error(
      dados?.erro?.mensagem || 'Credenciais inválidas. Verifique o e-mail e a senha.'
    );
    erro.codigo = dados?.erro?.codigo || 'CREDENCIAIS_INVALIDAS';
    erro.status = resposta.status;
    throw erro;
  }

  if (!dados.sucesso || !dados.token || !dados.usuario) {
    const erro = new Error('Resposta inesperada do servidor. Tente novamente.');
    erro.codigo = 'RESPOSTA_INVALIDA';
    throw erro;
  }

  return { usuario: dados.usuario, token: dados.token };
}

// ---------------------------------------------------------------------------
// API pública do serviço
// ---------------------------------------------------------------------------

const usarBackendReal = import.meta.env.VITE_USE_REAL_AUTH === 'true';

/**
 * Realiza login do usuário.
 * Usa backend real se VITE_USE_REAL_AUTH=true, caso contrário usa simulação.
 *
 * @param {string} email - E-mail institucional
 * @param {string} senha - Senha
 * @returns {Promise<{ usuario: object, token: string }>}
 * @throws {Error} Se as credenciais forem inválidas ou houver erro de rede
 */
export async function login(email, senha) {
  if (usarBackendReal) {
    return loginReal(email, senha);
  }
  return loginSimulado(email, senha);
}

/**
 * Encerra a sessão do usuário, removendo os dados do localStorage.
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Persiste a sessão no localStorage.
 * @param {{ usuario: object, token: string }} sessao
 */
export function persistirSessao({ usuario, token }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

/**
 * Recupera a sessão salva no localStorage.
 * @returns {{ usuario: object, token: string } | null}
 */
export function recuperarSessao() {
  const token = localStorage.getItem(TOKEN_KEY);
  const usuarioRaw = localStorage.getItem(USER_KEY);

  if (!token || !usuarioRaw) return null;

  try {
    const usuario = JSON.parse(usuarioRaw);
    return { usuario, token };
  } catch {
    logout(); // Dados corrompidos — limpa
    return null;
  }
}

/**
 * Verifica se um token simulado (modo dev) ainda é válido.
 * No modo com backend real, a validação é feita pelo servidor.
 * @param {string} token
 * @returns {boolean}
 */
export function tokenValido(token) {
  if (!token) return false;

  if (token.startsWith('sim.')) {
    try {
      const payload = JSON.parse(atob(token.slice(4)));
      return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }

  // Para tokens reais (JWT), considerar válido e deixar o backend rejeitar se expirado
  return true;
}

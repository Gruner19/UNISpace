/**
 * LoginForm.jsx — Formulário de autenticação institucional (P1.3 / T01)
 *
 * Implementa HU-01: login com e-mail institucional e senha, com validações
 * em tempo real, mensagens de erro claras e controle de estado de envio.
 */
import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { validarEmailInstitucional, validarSenha } from '../../services/authService';
import { FormField } from '../../components/common/FormField';
import { AlertErro } from '../../components/common/AlertErro';

// ---------------------------------------------------------------------------
// Ícones SVG elegantes
// ---------------------------------------------------------------------------

function IconeEmail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconeSenha() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconeMostrarSenha({ visivel }) {
  return visivel ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Estado inicial do formulário
// ---------------------------------------------------------------------------

const ESTADO_INICIAL = {
  email: '',
  senha: '',
  lembrar: false,
};

const ERROS_INICIAIS = {
  email: '',
  senha: '',
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { entrar, carregando, erro: erroAuth, limparErro } = useAuth();

  const [campos, setCampos] = useState(ESTADO_INICIAL);
  const [errosCampo, setErrosCampo] = useState(ERROS_INICIAIS);
  const [tocados, setTocados] = useState({ email: false, senha: false });
  const [senhaPorMostrar, setSenhaPorMostrar] = useState(false);

  /** Destino pós-login: página de origem ou agenda (T02). */
  const destino = location.state?.from?.pathname || '/agenda';

  // -------------------------------------------------------------------------
  // Validação
  // -------------------------------------------------------------------------

  const validarCampo = useCallback((nome, valor) => {
    if (nome === 'email') {
      const { valido, mensagem } = validarEmailInstitucional(valor);
      return valido ? '' : mensagem;
    }
    if (nome === 'senha') {
      const { valido, mensagem } = validarSenha(valor);
      return valido ? '' : mensagem;
    }
    return '';
  }, []);

  const validarTudo = useCallback(() => {
    const novosErros = {
      email: validarCampo('email', campos.email),
      senha: validarCampo('senha', campos.senha),
    };
    setErrosCampo(novosErros);
    return !novosErros.email && !novosErros.senha;
  }, [campos, validarCampo]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const novoValor = type === 'checkbox' ? checked : value;

      setCampos((prev) => ({ ...prev, [name]: novoValor }));
      limparErro();

      // Valida em tempo real apenas para campos já tocados
      if (tocados[name]) {
        setErrosCampo((prev) => ({
          ...prev,
          [name]: validarCampo(name, novoValor),
        }));
      }
    },
    [tocados, validarCampo, limparErro]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      setTocados((prev) => ({ ...prev, [name]: true }));
      setErrosCampo((prev) => ({
        ...prev,
        [name]: validarCampo(name, value),
      }));
    },
    [validarCampo]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setTocados({ email: true, senha: true });

      if (!validarTudo()) return;

      try {
        await entrar(campos.email, campos.senha);
        navigate(destino, { replace: true });
      } catch {
        // Erro já tratado pelo AuthContext (erroAuth)
      }
    },
    [campos, validarTudo, entrar, navigate, destino]
  );

  const toggleSenha = useCallback(() => setSenhaPorMostrar((v) => !v), []);

  const formularioInvalido =
    carregando ||
    Boolean(errosCampo.email) ||
    Boolean(errosCampo.senha) ||
    !campos.email ||
    !campos.senha;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Formulário de acesso ao UNISpace"
      className="login-form"
    >
      {/* Alerta de erro de autenticação */}
      {erroAuth && (
        <AlertErro
          titulo="Falha na autenticação"
          mensagem={erroAuth}
        />
      )}

      {/* Campos */}
      <div className="login-form__fields">
        <FormField
          id="email"
          label="E-mail institucional"
          required
          type="email"
          value={campos.email}
          onChange={(e) => handleChange({ target: { name: 'email', value: e.target.value } })}
          onBlur={(e) => handleBlur({ target: { name: 'email', value: e.target.value } })}
          placeholder="exemplo@universidade.br"
          error={tocados.email ? errosCampo.email : ''}
          autoComplete="email"
          icon={<IconeEmail />}
        />

        <FormField
          id="senha"
          label="Senha de acesso"
          required
          type={senhaPorMostrar ? 'text' : 'password'}
          value={campos.senha}
          onChange={(e) => handleChange({ target: { name: 'senha', value: e.target.value } })}
          onBlur={(e) => handleBlur({ target: { name: 'senha', value: e.target.value } })}
          placeholder="••••••••"
          error={tocados.senha ? errosCampo.senha : ''}
          autoComplete="current-password"
          icon={<IconeSenha />}
          actionBtn={
            <button
              type="button"
              className="form-field__action-btn"
              onClick={toggleSenha}
              aria-label={senhaPorMostrar ? 'Ocultar senha' : 'Mostrar senha'}
              title={senhaPorMostrar ? 'Ocultar senha' : 'Mostrar senha'}
              tabIndex={0}
            >
              <IconeMostrarSenha visivel={senhaPorMostrar} />
            </button>
          }
        />
      </div>

      {/* Opções: Lembrar e Esqueci Senha */}
      <div className="login-form__options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="lembrar"
            checked={campos.lembrar}
            onChange={handleChange}
          />
          <span>Lembrar meu acesso</span>
        </label>

        <a href="#esqueci-senha" onClick={(e) => e.preventDefault()} className="login-form__forgot-link">
          Esqueci minha senha
        </a>
      </div>

      {/* Botão de Envio */}
      <button
        type="submit"
        className="btn btn--primary btn--full"
        disabled={formularioInvalido}
        aria-busy={carregando}
      >
        {carregando ? (
          <>
            <span className="btn__spinner" aria-hidden="true" />
            <span>Autenticando…</span>
          </>
        ) : (
          <span>Entrar no Sistema</span>
        )}
      </button>
    </form>
  );
}

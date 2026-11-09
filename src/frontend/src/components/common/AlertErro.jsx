/**
 * AlertErro.jsx — Componente de alerta de erro acessível e moderno (P1.3)
 */

/**
 * @param {object} props
 * @param {string} props.mensagem   - Texto principal do erro
 * @param {string} [props.titulo]   - Título opcional (ex.: "Acesso negado")
 */
export function AlertErro({ mensagem, titulo }) {
  if (!mensagem) return null;

  return (
    <div className="alert alert--error" role="alert" aria-live="assertive">
      <svg
        className="alert__icon"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <div className="alert__content">
        {titulo && <p className="alert__title">{titulo}</p>}
        <p className="alert__message">{mensagem}</p>
      </div>
    </div>
  );
}

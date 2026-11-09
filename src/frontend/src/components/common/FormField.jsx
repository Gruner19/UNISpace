/**
 * FormField.jsx — Campo de formulário reutilizável (P1.3)
 *
 * Renderiza label, input, ícone opcional, mensagem de erro e hint.
 * Acessível: associa label ao input via htmlFor/id e anuncia erros via aria-describedby.
 */

/**
 * @param {object} props
 * @param {string}  props.id          - ID do input (obrigatório para acessibilidade)
 * @param {string}  props.label       - Texto do label
 * @param {boolean} [props.required]  - Exibe asterisco no label
 * @param {string}  [props.type]      - Tipo do input (default: "text")
 * @param {string}  [props.value]     - Valor controlado
 * @param {Function} [props.onChange] - Handler de mudança
 * @param {Function} [props.onBlur]   - Handler de blur
 * @param {string}  [props.placeholder]
 * @param {string}  [props.error]     - Mensagem de erro (exibida abaixo do input)
 * @param {string}  [props.hint]      - Texto de ajuda
 * @param {React.ReactNode} [props.icon]       - Ícone à esquerda do input
 * @param {React.ReactNode} [props.actionBtn]  - Botão à direita (ex.: mostrar senha)
 * @param {boolean} [props.disabled]
 * @param {string}  [props.autoComplete]
 */
export function FormField({
  id,
  label,
  required = false,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  hint,
  icon,
  actionBtn,
  disabled = false,
  autoComplete,
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const descriptionIds = [
    error && errorId,
    hint && hintId,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="form-field">
      <div className="form-field__label-row">
        <label
          htmlFor={id}
          className={`form-field__label${required ? ' form-field__label--required' : ''}`}
        >
          {label}
        </label>
      </div>

      <div className="form-field__wrapper">
        {icon && (
          <span className="form-field__icon" aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionIds || undefined}
          className={[
            'form-field__input',
            icon ? 'form-field__input--with-icon' : '',
            actionBtn ? 'form-field__input--with-action' : '',
            error ? 'form-field__input--error' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />

        {actionBtn && actionBtn}
      </div>

      {error && (
        <span id={errorId} className="form-field__error" role="alert">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      )}

      {hint && !error && (
        <span id={hintId} className="form-field__hint">
          {hint}
        </span>
      )}
    </div>
  );
}

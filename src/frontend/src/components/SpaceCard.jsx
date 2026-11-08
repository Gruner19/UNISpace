import { rotuloTipo } from '../data/espacos.js';

export default function SpaceCard({ espaco, onReservar }) {
  return (
    <article className="space-card">
      <div className={`space-card__visual space-card__visual--${espaco.cor}`}>
        <span className="space-card__icon" aria-hidden="true">{espaco.icone}</span>
        <span className="space-card__badge">{espaco.destaque}</span>
        <span className="space-card__code">{espaco.codigo}</span>
      </div>

      <div className="space-card__body">
        <div className="space-card__heading">
          <div>
            <p className="eyebrow">{rotuloTipo(espaco.tipo)}</p>
            <h3>{espaco.nome}</h3>
          </div>
          <span className="space-card__capacity" title="Capacidade máxima">
            <span aria-hidden="true">♙</span> {espaco.capacidade}
          </span>
        </div>
        <p className="space-card__location">
          <span aria-hidden="true">⌖</span> {espaco.localizacao}
        </p>
        <p className="space-card__description">{espaco.descricao}</p>
        <button
          className="button button--outline space-card__action"
          onClick={() => onReservar(espaco)}
          type="button"
        >
          Solicitar reserva <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

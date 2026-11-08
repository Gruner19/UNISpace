import { useState } from 'react';
import { criarReserva } from '../../services/reservasApi.js';

export default function ReservationModal({ espaco, dataInicial, onClose, onSuccess }) {
  const [data, setData] = useState(dataInicial);
  const [horarioInicio, setHorarioInicio] = useState('14:00');
  const [horarioFim, setHorarioFim] = useState('16:00');
  const [numeroParticipantes, setNumeroParticipantes] = useState(2);
  const [finalidade, setFinalidade] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');

    if (horarioFim <= horarioInicio) {
      setErro('O horário de término deve ser posterior ao horário de início.');
      return;
    }

    setEnviando(true);
    try {
      const reserva = await criarReserva({
        espacoId: espaco.id,
        data,
        horarioInicio,
        horarioFim,
        numeroParticipantes: Number(numeroParticipantes),
        finalidade
      });
      onSuccess(reserva);
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !enviando) onClose();
      }}
    >
      <section
        aria-labelledby="reservation-title"
        aria-modal="true"
        className="reservation-modal"
        role="dialog"
      >
        <button
          aria-label="Fechar"
          className="modal-close"
          disabled={enviando}
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <div className={`modal-icon modal-icon--${espaco.cor}`} aria-hidden="true">
          {espaco.icone}
        </div>
        <p className="eyebrow">Nova solicitação</p>
        <h2 id="reservation-title">Reserve seu espaço</h2>
        <p className="modal-subtitle">
          {espaco.nome} <span>·</span> {espaco.localizacao}
        </p>

        <form className="reservation-form" onSubmit={handleSubmit}>
          <label>
            Data
            <input
              min={new Date().toLocaleDateString('en-CA')}
              onChange={(event) => setData(event.target.value)}
              required
              type="date"
              value={data}
            />
          </label>
          <div className="form-grid">
            <label>
              Início
              <input
                onChange={(event) => setHorarioInicio(event.target.value)}
                required
                type="time"
                value={horarioInicio}
              />
            </label>
            <label>
              Término
              <input
                onChange={(event) => setHorarioFim(event.target.value)}
                required
                type="time"
                value={horarioFim}
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Participantes
              <input
                max={espaco.capacidade}
                min="1"
                onChange={(event) => setNumeroParticipantes(event.target.value)}
                required
                type="number"
                value={numeroParticipantes}
              />
            </label>
            <div className="capacity-note">
              <span aria-hidden="true">♙</span>
              Capacidade máxima: {espaco.capacidade}
            </div>
          </div>
          <label>
            Finalidade
            <textarea
              maxLength="300"
              minLength="5"
              onChange={(event) => setFinalidade(event.target.value)}
              placeholder="Ex.: estudo em grupo de Engenharia de Software"
              required
              rows="3"
              value={finalidade}
            />
          </label>

          {erro && (
            <p className="form-error" role="alert">
              <span aria-hidden="true">!</span> {erro}
            </p>
          )}

          <div className="form-actions">
            <button className="button button--ghost" disabled={enviando} onClick={onClose} type="button">
              Voltar
            </button>
            <button className="button button--primary" disabled={enviando} type="submit">
              {enviando ? 'Enviando...' : 'Confirmar reserva'}
              {!enviando && <span aria-hidden="true">→</span>}
            </button>
          </div>
          <p className="form-footnote">A confirmação depende das regras e da disponibilidade no servidor.</p>
        </form>
      </section>
    </div>
  );
}

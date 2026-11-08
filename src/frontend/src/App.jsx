import { useMemo, useState } from 'react';
import SpaceCard from './components/SpaceCard.jsx';
import { espacos, tiposEspaco } from './data/espacos.js';
import ReservationModal from './features/reservations/ReservationModal.jsx';

function dataLocalISO() {
  const hoje = new Date();
  const deslocamentoFuso = hoje.getTimezoneOffset() * 60000;
  return new Date(hoje.getTime() - deslocamentoFuso).toISOString().slice(0, 10);
}

function dataPorExtenso(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date(`${data}T12:00:00`));
}

export default function App() {
  const [tipoSelecionado, setTipoSelecionado] = useState('TODOS');
  const [capacidadeMinima, setCapacidadeMinima] = useState('');
  const [data, setData] = useState(dataLocalISO);
  const [espacoSelecionado, setEspacoSelecionado] = useState(null);
  const [aviso, setAviso] = useState('');

  const espacosFiltrados = useMemo(
    () =>
      espacos.filter(
        (espaco) =>
          (tipoSelecionado === 'TODOS' || espaco.tipo === tipoSelecionado) &&
          espaco.capacidade >= (Number(capacidadeMinima) || 0)
      ),
    [tipoSelecionado, capacidadeMinima]
  );

  function confirmarReserva(reserva) {
    setEspacoSelecionado(null);
    setAviso(`Reserva confirmada! Código ${reserva.codigoConfirmacao}.`);
    window.setTimeout(() => setAviso(''), 6000);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a aria-label="UNISpace início" className="brand" href="#">
          <span aria-hidden="true" className="brand__mark">U</span>
          <span className="brand__name">UNI<span>Space</span></span>
        </a>

        <p className="sidebar__label">MENU PRINCIPAL</p>
        <nav aria-label="Navegação principal" className="navigation">
          <a className="navigation__item navigation__item--active" href="#espacos">
            <span aria-hidden="true" className="navigation__icon">▦</span>
            Explorar espaços
          </a>
          <button className="navigation__item navigation__item--disabled" disabled type="button">
            <span aria-hidden="true" className="navigation__icon">▣</span>
            Minhas reservas <span className="navigation__soon">Em breve</span>
          </button>
        </nav>

        <div className="sidebar__bottom">
          <div className="help-card">
            <span aria-hidden="true" className="help-card__icon">✦</span>
            <strong>Feito para compartilhar</strong>
            <p>Encontre o espaço ideal para suas ideias.</p>
          </div>
          <div className="profile">
            <div className="profile__avatar">D</div>
            <div className="profile__info">
              <strong>Estudante Demo</strong>
              <span>Conta de demonstração</span>
            </div>
            <span aria-hidden="true" className="profile__menu">···</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="espacos">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Início</span><span aria-hidden="true">/</span><strong>Explorar espaços</strong>
          </div>
          <div className="topbar__right">
            <span className="demo-pill"><span /> Ambiente de demonstração</span>
            <button aria-label="Notificações" className="notification-button" type="button">
              ♧<i />
            </button>
          </div>
        </header>

        <section className="welcome">
          <div>
            <p className="welcome__date">{dataPorExtenso(data)}</p>
            <h1>Encontre seu próximo <span>espaço.</span></h1>
            <p className="welcome__subtitle">
              Um lugar para estudar, criar e fazer acontecer no campus.
            </p>
          </div>
          <div aria-hidden="true" className="welcome__illustration">
            <span className="illustration-sun" />
            <span className="illustration-building building-one" />
            <span className="illustration-building building-two" />
            <span className="illustration-ground" />
            <span className="illustration-tree tree-one" />
            <span className="illustration-tree tree-two" />
          </div>
        </section>

        {aviso && (
          <div className="success-banner" role="status">
            <span aria-hidden="true">✓</span> {aviso}
            <button aria-label="Fechar aviso" onClick={() => setAviso('')} type="button">×</button>
          </div>
        )}

        <section aria-label="Filtros de espaços" className="search-panel">
          <div className="search-panel__intro">
            <span aria-hidden="true" className="search-panel__icon">⌕</span>
            <div>
              <strong>O que você está procurando?</strong>
              <span>Encontre o espaço certo para o seu momento.</span>
            </div>
          </div>
          <label className="filter-field">
            <span>Data desejada</span>
            <span className="filter-field__control">
              <span aria-hidden="true">▣</span>
              <input
                aria-label="Data desejada"
                min={dataLocalISO()}
                onChange={(event) => setData(event.target.value)}
                type="date"
                value={data}
              />
            </span>
          </label>
          <label className="filter-field">
            <span>Tipo de espaço</span>
            <select onChange={(event) => setTipoSelecionado(event.target.value)} value={tipoSelecionado}>
              {tiposEspaco.map((tipo) => (
                <option key={tipo.valor} value={tipo.valor}>{tipo.rotulo}</option>
              ))}
            </select>
          </label>
          <label className="filter-field filter-field--capacity">
            <span>Capacidade mínima</span>
            <input
              min="1"
              onChange={(event) => setCapacidadeMinima(event.target.value)}
              placeholder="Qualquer"
              type="number"
              value={capacidadeMinima}
            />
          </label>
        </section>

        <section className="spaces-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SUA UNIVERSIDADE, SEU ESPAÇO</p>
              <h2>Espaços disponíveis <span className="result-count">{espacosFiltrados.length}</span></h2>
            </div>
          </div>

          <div className="availability-note">
            <span className="availability-note__dot" />
            <p>
              <strong>Catálogo inicial.</strong> A disponibilidade em tempo real ainda não está
              conectada. A reserva enviada será validada pelo backend.
            </p>
          </div>

          {espacosFiltrados.length > 0 ? (
            <div className="space-grid">
              {espacosFiltrados.map((espaco) => (
                <SpaceCard key={espaco.id} espaco={espaco} onReservar={setEspacoSelecionado} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">⌕</span>
              <h3>Nenhum espaço encontrado</h3>
              <p>Tente ajustar o tipo ou a capacidade mínima.</p>
            </div>
          )}
        </section>

        <footer className="page-footer">
          <span>© 2026 UNISpace</span>
          <span>Construindo espaços para compartilhar <b>♥</b></span>
        </footer>
      </main>

      {espacoSelecionado && (
        <ReservationModal
          dataInicial={data}
          espaco={espacoSelecionado}
          onClose={() => setEspacoSelecionado(null)}
          onSuccess={confirmarReserva}
        />
      )}
    </div>
  );
}

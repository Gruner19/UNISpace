/**
 * MinhasReservas.jsx — Tela "Minhas Reservas" (T7.2)
 *
 * Exibe a listagem das reservas ativas do usuário com opção de cancelamento.
 * Possui modal de confirmação ao clicar em "Cancelar Reserva".
 * Atualiza a lista após o cancelamento bem-sucedido.
 *
 * Histórias: HU-05 · RN-05, RN-11
 */

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cancelarReserva, getMinhasReservas } from '../services/reservationService';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-bg)',
  },
  header: {
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '-0.025em',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 800,
    color: 'var(--color-text-primary)',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: 'var(--color-text-secondary)',
    marginBottom: '2rem',
  },
  reservationsSection: {
    flex: 1,
    padding: '2rem 1.5rem',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: 'var(--color-text-secondary)',
  },
  reservationCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1rem',
  },
  reservationInfo: {
    marginBottom: '1rem',
  },
  reservationDetails: {
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary)',
    marginBottom: '0.5rem',
  },
  codeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.25rem 0.75rem',
    backgroundColor: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: '1px solid #6ee7b7',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    marginTop: '0.5rem',
  },
  cancelButton: {
    width: '100%',
    marginTop: '0.5rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.75rem',
    padding: '2rem',
    width: '90%',
    maxWidth: '400px',
    textAlign: 'center',
    position: 'relative',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    marginBottom: '1rem',
  },
  modalMessage: {
    color: 'var(--color-text-secondary)',
    marginBottom: '2rem',
    fontSize: '0.875rem',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
  button: {
    padding: '0.375rem 0.875rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'inherit',
  },
  buttonPrimary: {
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
  },
  buttonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid #ef4444',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
};
/**
 * MinhasReservas — Componente da tela Minhas Reservas
 */
export function MinhasReservas() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirModal, setAbrirModal] = useState(false);
  const [reservaParaCancelar, setReservaParaCancelar] = useState(null);

  // Carregar reservas ao montar o componente
  useEffect(() => {
    async function carregarReservas() {
      setCarregando(true);
      try {
        const reservasUsuario = await getMinhasReservas();
        setReservas(reservasUsuario);
      } catch (erro) {
        console.error('Erro ao carregar reservas:', erro);
      } finally {
        setCarregando(false);
      }
    }

    if (usuario) {
      carregarReservas();
    }
  }, [usuario]);

  // Atualizar lista após cancelamento
  useEffect(() => {
    if (reservaParaCancelar) {
      setReservas((prevReservas) =>
        prevReservas.filter((res) => res.id !== reservaParaCancelar)
      );
      setReservaParaCancelar(null);
    }
  }, [reservaParaCancelar]);

  const handleCancelar = async (reservaId) => {
    setReservaParaCancelar(reservaId);
    setAbrirModal(true);
  };

  const confirmarCancelamento = async () => {
    if (!reservaParaCancelar) return;

    try {
      const resultado = await cancelarReserva(reservaParaCancelar);
      console.log(resultado);

      // Fechar modal e atualizar lista
      setAbrirModal(false);
      setReservaParaCancelar(null);

      // Exibir sucesso
      window.alert(resultado.mensagem || 'Reserva cancelada com sucesso.');

      // A lista será atualizada pelo useEffect
    } catch (erro) {
      console.error('Erro ao cancelar reserva:', erro);
      window.alert(
        erro.message || 'Erro ao cancelar reserva. Tente novamente.'
      );
    } finally {
      setReservaParaCancelar(null);
    }
  };

  const cancelarModal = () => {
    setAbrirModal(false);
    setReservaParaCancelar(null);
  };

  if (!usuario) {
    return null;
  }

  return (
    <div style={styles.page}>
      {/* Barra de navegação */}
      <header style={styles.header}>
        <span style={styles.brand}>🏛️ UNISpace</span>
        <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>
          {usuario.nome}
        </span>
      </header>

      {/* Conteúdo principal */}
      <main style={styles.reservationsSection}>
        <h1 style={styles.title}>Minhas Reservas</h1>
        <p style={styles.subtitle}>
          Confira suas reservas ativas e gerencie seus horários
        </p>

        {carregando ? (
          <p>Carregando reservas...</p>
        ) : reservas.length === 0 ? (
          <div style={styles.emptyState}>
            <p>Não há reservas ativas no momento.</p>
          </div>
        ) : (
          <div style={styles.reservationsList}>
            {reservas.map((reserva) => (
              <div
                key={reserva.id}
                style={styles.reservationCard}
              >
                <div style={styles.reservationInfo}>
                  <div style={styles.reservationDetails}>
                    <strong>Espaço:</strong> {reserva.espace}
                  </div>
                  <div style={styles.reservationDetails}>
                    <strong>Data:</strong> {reserva.data}
                  </div>
                  <div style={styles.reservationDetails}>
                    <strong>Horário:</strong> {reserva.horarioInicio} - {reserva.horarioFim}
                  </div>
                </div>

                <div style={styles.codeBadge}>
                  Código: {reserva.codigoConfirmacao}
                </div>

                <button
                  style={styles.cancelButton}
                  onClick={() => handleCancelar(reserva.id)}
                >
                  Cancelar Reserva
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal de confirmação de cancelamento */}
        {abrirModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Confirmar Cancelamento</h3>
              <p style={styles.modalMessage}>
                Tem certeza que deseja cancelar esta reserva? O espaço será
                liberado e as horas serão devolidas à sua cota semanal.
              </p>
              <div style={styles.modalActions}>
                <button
                  style={styles.button buttonSecondary}
                  onClick={cancelarModal}
                >
                  Cancelar
                </button>
                <button
                  style={styles.button buttonDanger}
                  onClick={confirmarCancelamento}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
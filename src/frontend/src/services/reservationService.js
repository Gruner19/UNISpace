/**
 * reservationService.js — Serviço de reservas do UNISpace (T7.2)
 *
 * Fornece funções para listar reservas do usuário e cancelar reservas.
 * Em modo desenvolvimento (VITE_USE_REAL_AUTH !== 'true'), opera em modo simulado.
 */

const API_BASE = '/api/v1';

/**
 * Obtém as reservas ativas do usuário autenticado.
 * @returns {Promise<Array>} Lista de reservas ativas
 */
export async function getMinhasReservas() {
  const token = localStorage.getItem('unispace_token');

  if (!token) {
    return [];
  }

  // Modo backend real
  if (import.meta.env.VITE_USE_REAL_AUTH === 'true') {
    const resposta = await fetch(`${API_BASE}/reservas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resposta.ok) {
      throw new Error('Erro ao carregar reservas.');
    }

    const dados = await resposta.json();
    return dados.reservas || [];
  }

  // Modo simulado - retorna reservas fictícias para desenvolvimento
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Dados simulados - em um cenário real viriam do backend
  return [
    {
      id: 'res-001',
      espace: 'Sala de Estudo A',
      data: '20/11/2026',
      horarioInicio: '14:00',
      horarioFim: '16:00',
      codigoConfirmacao: 'CONF-1234',
      status: 'confirmada',
    },
    {
      id: 'res-002',
      espace: 'Laboratório B',
      data: '22/11/2026',
      horarioInicio: '09:00',
      horarioFim: '11:00',
      codigoConfirmacao: 'CONF-5678',
      status: 'confirmada',
    },
  ];
}

/**
 * Cancela uma reserva do usuário.
 * @param {string} reservaId - ID da reserva a ser cancelada
 * @returns {Promise<Object>} Resultado do cancelamento
 */
export async function cancelarReserva(reservaId) {
  const token = localStorage.getItem('unispace_token');

  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  // Modo backend real
  if (import.meta.env.VITE_USE_REAL_AUTH === 'true') {
    const resposta = await fetch(`${API_BASE}/reservas/${reservaId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.mensagem || 'Erro ao cancelar reserva.');
    }

    return await resposta.json();
  }

  // Modo simulado - simula cancelamento bem-sucedido
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    sucesso: true,
    mensagem: 'Reserva cancelada com sucesso.',
    reservaId,
  };
}
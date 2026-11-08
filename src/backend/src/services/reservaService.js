'use strict';

const { REGRAS_NEGOCIO } = require('../config/regrasNegocio');
const { ErroDominioReserva } = require('../utils/errosDominio');
const {
  calcularDuracaoMinutos,
  intervalosConflitam,
  validarEmailInstitucional,
  validarDuracaoReserva,
  validarCapacidadeEspaco,
  validarPayloadCriacaoReserva
} = require('../validators/reservaValidator');

class ReservaService {
  /**
   * @param {import('../repositories/reservaRepository').ReservaRepository} reservaRepository
   */
  constructor(reservaRepository) {
    this.reservaRepository = reservaRepository;
  }

  /**
   * Executa a criação atômica de uma reserva (T6.2 / CU-03), validando:
   * - RN-02: Autenticação e e-mail institucional
   * - RN-12: Espaço ativo
   * - RN-08: Duração mínima, máxima e blocos por tipo de espaço
   * - RN-09: Capacidade máxima de participantes
   * - RN-06: Prioridade soberana de bloqueios administrativos
   * - RN-01 e RN-10: Anti-conflito de horário sob concorrência simultânea
   * - RN-03: Cota semanal máxima (6h) e limite de reservas futuras ativas (2)
   * - RN-13: Registro obrigatório em trilha de auditoria dentro da mesma transação
   */
  async criarReservaAtomica(payload, contextoUsuario) {
    // 1. Valida autenticação e e-mail institucional (RN-02)
    if (!contextoUsuario || !contextoUsuario.id) {
      throw new ErroDominioReserva(
        'USUARIO_NAO_AUTENTICADO',
        'É necessário estar autenticado no sistema para realizar uma reserva (RN-02).',
        401
      );
    }
    validarEmailInstitucional(contextoUsuario.email);

    // 2. Valida estrutura e tipos do payload de entrada
    validarPayloadCriacaoReserva(payload);

    const { espacoId, data, horarioInicio, horarioFim, numeroParticipantes, finalidade } = payload;
    const duracaoMinutos = calcularDuracaoMinutos(horarioInicio, horarioFim);
    const duracaoHoras = duracaoMinutos / 60;

    // 3. Inicia transação atômica serializada no espaço solicitado (RN-10)
    return this.reservaRepository.executarEmTransacaoAtomica(espacoId, async (tx) => {
      // 3.1. Verifica existência e status ativo do espaço (RN-12)
      const espaco = tx.buscarEspacoPorId(espacoId);
      if (!espaco) {
        throw new ErroDominioReserva(
          'ESPACO_NAO_ENCONTRADO',
          'O espaço físico solicitado não foi encontrado no catálogo.',
          404
        );
      }

      if (!espaco.ativo) {
        throw new ErroDominioReserva(
          'ESPACO_INATIVO',
          'Este espaço encontra-se desativado e não aceita novas reservas (RN-12).',
          422
        );
      }

      // 3.2. Valida duração mínima, máxima e tamanho de bloco do espaço (RN-08)
      validarDuracaoReserva(espaco, duracaoMinutos);

      // 3.3. Valida capacidade física do espaço (RN-09)
      validarCapacidadeEspaco(espaco, numeroParticipantes);

      // 3.4. Verifica bloqueios administrativos/manutenção no período (RN-06)
      const bloqueiosAtivos = tx.listarBloqueiosAtivosEspacoData(espacoId, data);
      const bloqueioConflitante = bloqueiosAtivos.find((b) =>
        intervalosConflitam(horarioInicio, horarioFim, b.horarioInicio, b.horarioFim)
      );

      if (bloqueioConflitante) {
        throw new ErroDominioReserva(
          'ESPACO_BLOQUEADO_ADMIN',
          `O espaço está bloqueado administrativamente neste horário (${bloqueioConflitante.motivo}) (RN-06).`,
          409,
          { bloqueioId: bloqueioConflitante.id, motivo: bloqueioConflitante.motivo }
        );
      }

      // 3.5. Verifica sobreposição com reservas confirmadas existentes (RN-01 e RN-10)
      const reservasConfirmadas = tx.listarReservasConfirmadasEspacoData(espacoId, data);
      const reservaConflitante = reservasConfirmadas.find((r) =>
        intervalosConflitam(horarioInicio, horarioFim, r.horarioInicio, r.horarioFim)
      );

      if (reservaConflitante) {
        throw new ErroDominioReserva(
          'CONFLITO_HORARIO_RESERVA',
          'O espaço já possui uma reserva confirmada que se sobrepõe ao horário solicitado (RN-01 / RN-10).',
          409,
          {
            espacoId,
            data,
            conflitoHorarioInicio: reservaConflitante.horarioInicio,
            conflitoHorarioFim: reservaConflitante.horarioFim
          }
        );
      }

      // 3.6. Valida cota semanal de horas e limite de reservas ativas futuras do usuário (RN-03)
      const reservasDoUsuario = tx.listarReservasContabilizadasUsuario(contextoUsuario.id);
      const reservasConfirmadasUsuario = reservasDoUsuario.filter((r) => r.status === 'CONFIRMADA');

      const maxAtivas =
        contextoUsuario.maxReservasAtivas ?? REGRAS_NEGOCIO.MAX_RESERVAS_ATIVAS_FUTURAS;
      if (reservasConfirmadasUsuario.length >= maxAtivas) {
        throw new ErroDominioReserva(
          'LIMITE_RESERVAS_ATIVAS_EXCEDIDO',
          `Você já atingiu o limite máximo de ${maxAtivas} reservas ativas simultâneas (RN-03).`,
          422,
          { reservasAtivasAtuais: reservasConfirmadasUsuario.length, limiteMaximo: maxAtivas }
        );
      }

      const minutosUsadosNaSemana = reservasDoUsuario.reduce(
        (acc, r) => acc + (r.duracaoMinutos || 0),
        0
      );
      const horasUsadasNaSemana = minutosUsadosNaSemana / 60;
      const cotaMaximaHoras =
        contextoUsuario.cotaSemanalHoras ?? REGRAS_NEGOCIO.COTA_SEMANAL_MAXIMA_HORAS;

      if (horasUsadasNaSemana + duracaoHoras > cotaMaximaHoras) {
        throw new ErroDominioReserva(
          'COTA_SEMANAL_EXCEDIDA',
          `Cota semanal de horas excedida. Saldo disponível: ${(cotaMaximaHoras - horasUsadasNaSemana).toFixed(1)}h; solicitado: ${duracaoHoras.toFixed(1)}h (RN-03).`,
          422,
          {
            horasUsadasNaSemana,
            horasSolicitadas: duracaoHoras,
            cotaMaximaHoras
          }
        );
      }

      // 3.7. Persiste a reserva confirmada
      const reservaCriada = tx.inserirReserva({
        espacoId,
        usuarioId: contextoUsuario.id,
        data,
        horarioInicio,
        horarioFim,
        duracaoMinutos,
        numeroParticipantes,
        finalidade: finalidade.trim(),
        ipSolicitante: contextoUsuario.ip || '127.0.0.1'
      });

      // 3.8. Registra evento na trilha de auditoria imutável dentro da mesma transação (RN-13)
      tx.inserirAuditoria({
        reservaId: reservaCriada.id,
        usuarioId: contextoUsuario.id,
        acao: 'CRIACAO_RESERVA',
        statusAnterior: null,
        statusNovo: 'CONFIRMADA',
        ipSolicitante: contextoUsuario.ip || '127.0.0.1',
        detalhes: {
          espacoId,
          data,
          horarioInicio,
          horarioFim,
          duracaoMinutos,
          numeroParticipantes,
          codigoConfirmacao: reservaCriada.codigoConfirmacao
        }
      });

      return reservaCriada;
    });
  }
}

module.exports = { ReservaService };

'use strict';

const { REGRAS_NEGOCIO } = require('../config/regrasNegocio');
const { ErroDominioReserva } = require('../utils/errosDominio');
const {
  calcularDuracaoMinutos,
  intervalosConflitam,
  validarEmailInstitucional,
  validarDuracaoReserva,
  validarCapacidadeEspaco,
  validarPayloadCriacaoReserva,
  avaliarPrazoCancelamento
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

  /**
   * RN-03: Verifica cota semanal de horas e limite de reservas ativas futuras do usuário.
   * Reutilizado tanto pela criação direta (T6.2) quanto pela aprovação de reserva especial (T9.1).
   * @param {object} tx - Contexto transacional do repositório
   * @param {object} contextoUsuario - { id, maxReservasAtivas?, cotaSemanalHoras? }
   * @param {number} duracaoMinutos
   * @private
   */
  _verificarCotaESaldo(tx, contextoUsuario, duracaoMinutos) {
    const duracaoHoras = duracaoMinutos / 60;
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
  }

  /**
   * T9.1: Aprova uma reserva especial pendente pelo administrador.
   * Execução atômica por espaço: valida existência, que a reserva ainda está
   * pendente, ausência de bloqueio administrativo (RN-06), ausência de conflito
   * com reservas confirmadas (RN-01/RN-10) e cota do solicitante (RN-03).
   * Ao sucesso: status -> CONFIRMADA, auditoria (RN-13) e notificação ao solicitante.
   *
   * @param {string} reservaId
   * @param {object} contextoAdmin - { id, email, perfil } do administrador autenticado
   * @param {string} [ipSolicitante]
   * @returns {Promise<object>} Reserva aprovada
   */
  async aprovarReserva(reservaId, contextoAdmin, ipSolicitante = '127.0.0.1') {
    if (!contextoAdmin || !contextoAdmin.id) {
      throw new ErroDominioReserva(
        'USUARIO_NAO_AUTENTICADO',
        'É necessário estar autenticado no sistema para aprovar reservas.',
        401
      );
    }
    if (contextoAdmin.perfil !== 'ADMINISTRADOR') {
      throw new ErroDominioReserva(
        'PERFIL_NAO_AUTORIZADO',
        'Somente administradores podem aprovar ou rejeitar reservas especiais (T9.1).',
        403
      );
    }

    const reservaPrevia = this.reservaRepository.buscarReservaPorId(reservaId);
    if (!reservaPrevia) {
      throw new ErroDominioReserva('RESERVA_NAO_ENCONTRADA', 'A reserva informada não existe.', 404);
    }

    return this.reservaRepository.executarEmTransacaoAtomica(
      reservaPrevia.espacoId,
      async (tx) => {
        const reserva = tx.buscarReservaPorId(reservaId);
        if (!reserva) {
          throw new ErroDominioReserva('RESERVA_NAO_ENCONTRADA', 'A reserva informada não existe.', 404);
        }
        if (reserva.status !== 'PENDENTE_APROVACAO') {
          throw new ErroDominioReserva(
            'RESERVA_JA_PROCESSADA',
            `A reserva já foi processada (status atual: ${reserva.status}) e não pode ser aprovada novamente.`,
            409,
            { statusAtual: reserva.status }
          );
        }

        // RN-06: bloqueio administrativo ativo no período impede a confirmação
        const bloqueiosAtivos = tx.listarBloqueiosAtivosEspacoData(reserva.espacoId, reserva.data);
        const bloqueioConflitante = bloqueiosAtivos.find((b) =>
          intervalosConflitam(reserva.horarioInicio, reserva.horarioFim, b.horarioInicio, b.horarioFim)
        );
        if (bloqueioConflitante) {
          throw new ErroDominioReserva(
            'ESPACO_BLOQUEADO_ADMIN',
            `O espaço está bloqueado administrativamente neste horário (${bloqueioConflitante.motivo}) (RN-06).`,
            409,
            { bloqueioId: bloqueioConflitante.id, motivo: bloqueioConflitante.motivo }
          );
        }

        // RN-01 e RN-10: não confirma se houver reserva CONFIRMADA sobreposta
        const reservasConfirmadas = tx.listarReservasConfirmadasEspacoData(reserva.espacoId, reserva.data);
        const reservaConflitante = reservasConfirmadas.find((r) =>
          intervalosConflitam(reserva.horarioInicio, reserva.horarioFim, r.horarioInicio, r.horarioFim)
        );
        if (reservaConflitante) {
          throw new ErroDominioReserva(
            'CONFLITO_APROVACAO_RESERVA',
            'Não é possível aprovar: o espaço já possui uma reserva confirmada que se sobrepõe ao horário solicitado (RN-01 / RN-10).',
            409,
            {
              espacoId: reserva.espacoId,
              data: reserva.data,
              conflitoHorarioInicio: reservaConflitante.horarioInicio,
              conflitoHorarioFim: reservaConflitante.horarioFim
            }
          );
        }

        // RN-03: cota semanal e limite de reservas ativas do solicitante
        this._verificarCotaESaldo(tx, {
          id: reserva.usuarioId,
          maxReservasAtivas: undefined,
          cotaSemanalHoras: undefined
        }, reserva.duracaoMinutos);

        // Confirma a reserva
        const reservaAtualizada = tx.atualizarStatusReserva(reservaId, {
          status: 'CONFIRMADA',
          contabilizaCota: true
        });

        // RN-13: registro de auditoria da transição de status
        tx.inserirAuditoria({
          reservaId: reserva.id,
          usuarioId: contextoAdmin.id,
          acao: 'APROVACAO_RESERVA',
          statusAnterior: 'PENDENTE_APROVACAO',
          statusNovo: 'CONFIRMADA',
          ipSolicitante: ipSolicitante || '127.0.0.1',
          detalhes: {
            espacoId: reserva.espacoId,
            data: reserva.data,
            horarioInicio: reserva.horarioInicio,
            horarioFim: reserva.horarioFim,
            duracaoMinutos: reserva.duracaoMinutos,
            codigoConfirmacao: reserva.codigoConfirmacao,
            aprovadoPor: contextoAdmin.id
          }
        });

        // Critério de aceite T9: notificação ao solicitante
        this.reservaRepository.registrarNotificacao({
          usuarioId: reserva.usuarioId,
          reservaId: reserva.id,
          tipo: 'RESERVA_APROVADA',
          assunto: 'Sua reserva especial foi aprovada',
          corpo: `Sua reserva do espaço ${reserva.espacoId} em ${reserva.data} das ${reserva.horarioInicio} às ${reserva.horarioFim} foi aprovada e está confirmada.`,
          ipSolicitante
        });

        return reservaAtualizada;
      }
    );
  }

  /**
   * T9.1: Rejeita uma reserva especial pendente pelo administrador.
   * Execução atômica por espaço: valida existência e que ainda está pendente.
   * Ao sucesso: status -> CANCELADA_ADMIN com motivo, auditoria (RN-13) e
   * notificação ao solicitante.
   *
   * @param {string} reservaId
   * @param {object} contextoAdmin - { id, email, perfil } do administrador autenticado
   * @param {string} [motivo] - Motivo da rejeição
   * @param {string} [ipSolicitante]
   * @returns {Promise<object>} Reserva rejeitada
   */
  async rejeitarReserva(reservaId, contextoAdmin, motivo, ipSolicitante = '127.0.0.1') {
    if (!contextoAdmin || !contextoAdmin.id) {
      throw new ErroDominioReserva(
        'USUARIO_NAO_AUTENTICADO',
        'É necessário estar autenticado no sistema para rejeitar reservas.',
        401
      );
    }
    if (contextoAdmin.perfil !== 'ADMINISTRADOR') {
      throw new ErroDominioReserva(
        'PERFIL_NAO_AUTORIZADO',
        'Somente administradores podem aprovar ou rejeitar reservas especiais (T9.1).',
        403
      );
    }

    const reservaPrevia = this.reservaRepository.buscarReservaPorId(reservaId);
    if (!reservaPrevia) {
      throw new ErroDominioReserva('RESERVA_NAO_ENCONTRADA', 'A reserva informada não existe.', 404);
    }

    return this.reservaRepository.executarEmTransacaoAtomica(
      reservaPrevia.espacoId,
      async (tx) => {
        const reserva = tx.buscarReservaPorId(reservaId);
        if (!reserva) {
          throw new ErroDominioReserva('RESERVA_NAO_ENCONTRADA', 'A reserva informada não existe.', 404);
        }
        if (reserva.status !== 'PENDENTE_APROVACAO') {
          throw new ErroDominioReserva(
            'RESERVA_JA_PROCESSADA',
            `A reserva já foi processada (status atual: ${reserva.status}) e não pode ser rejeitada novamente.`,
            409,
            { statusAtual: reserva.status }
          );
        }

        const canceladaEm = new Date().toISOString();
        const reservaAtualizada = tx.atualizarStatusReserva(reservaId, {
          status: 'CANCELADA_ADMIN',
          motivoCancelamento: motivo || 'Rejeitada pelo administrador',
          canceladaEm
        });

        // RN-13: registro de auditoria da rejeição
        tx.inserirAuditoria({
          reservaId: reserva.id,
          usuarioId: contextoAdmin.id,
          acao: 'REJEICAO_RESERVA',
          statusAnterior: 'PENDENTE_APROVACAO',
          statusNovo: 'CANCELADA_ADMIN',
          ipSolicitante: ipSolicitante || '127.0.0.1',
          detalhes: {
            espacoId: reserva.espacoId,
            data: reserva.data,
            horarioInicio: reserva.horarioInicio,
            horarioFim: reserva.horarioFim,
            codigoConfirmacao: reserva.codigoConfirmacao,
            motivoRejeicao: motivo || null,
            rejeitadoPor: contextoAdmin.id
          }
        });

        // Critério de aceite T9: notificação ao solicitante
        this.reservaRepository.registrarNotificacao({
          usuarioId: reserva.usuarioId,
          reservaId: reserva.id,
          tipo: 'RESERVA_REJEITADA',
          assunto: 'Sua reserva especial foi rejeitada',
          corpo: `Sua reserva do espaço ${reserva.espacoId} em ${reserva.data} das ${reserva.horarioInicio} às ${reserva.horarioFim} foi rejeitada pelo administrador.${motivo ? ` Motivo: ${motivo}` : ''}`,
          ipSolicitante
        });

        return reservaAtualizada;
      }
    );
  }

  /**
   * T7.1 (HU-05 / RN-05 / RN-11 / RN-13): Cancela uma reserva de forma atômica.
   * - Somente o titular da reserva ou um ADMINISTRADOR pode cancelar (RN-11).
   * - Avalia o prazo de cancelamento de 2 horas (RN-05):
   *   - >= 2h de antecedência: libera horário e devolve horas à cota semanal (contabilizaCota = false).
   *   - < 2h de antecedência (antes do início): libera horário, mas mantém horas contabilizadas na cota.
   *   - Reserva já iniciada/passada: bloqueia com 422 (PRAZO_CANCELAMENTO_EXPIRADO).
   * - Registra auditoria imutável na mesma transação (RN-13) com rollback em caso de falha.
   *
   * @param {string} reservaId
   * @param {object} contextoUsuario - { id, email, perfil, ip? }
   * @param {string} [motivo]
   * @param {object} [opcoes] - { dataHoraReferencia?: Date|string, ipSolicitante?: string }
   * @returns {Promise<{ reserva: object, metaCancelamento: object }>}
   */
  async cancelarReserva(reservaId, contextoUsuario, motivo, opcoes = {}) {
    if (!contextoUsuario || !contextoUsuario.id) {
      throw new ErroDominioReserva(
        'USUARIO_NAO_AUTENTICADO',
        'É necessário estar autenticado no sistema para cancelar uma reserva.',
        401
      );
    }

    const reservaPrevia = this.reservaRepository.buscarReservaPorId(reservaId);
    if (!reservaPrevia) {
      throw new ErroDominioReserva(
        'RESERVA_NAO_ENCONTRADA',
        'A reserva informada não foi encontrada.',
        404
      );
    }

    const ipSolicitante = opcoes.ipSolicitante || contextoUsuario.ip || '127.0.0.1';
    const dataHoraReferencia = opcoes.dataHoraReferencia || new Date();

    return this.reservaRepository.executarEmTransacaoAtomica(
      reservaPrevia.espacoId,
      async (tx) => {
        const reserva = tx.buscarReservaPorId(reservaId);
        if (!reserva) {
          throw new ErroDominioReserva(
            'RESERVA_NAO_ENCONTRADA',
            'A reserva informada não foi encontrada.',
            404
          );
        }

        // RN-11: Só o dono da reserva ou o administrador pode cancelá-la
        const ehDono = reserva.usuarioId === contextoUsuario.id;
        const ehAdmin = contextoUsuario.perfil === 'ADMINISTRADOR';
        if (!ehDono && !ehAdmin) {
          throw new ErroDominioReserva(
            'PERMISSAO_CANCELAMENTO_NEGADA',
            'Somente o titular da reserva ou um administrador pode cancelá-la (RN-11).',
            403
          );
        }

        // Apenas reservas ativas (CONFIRMADA ou PENDENTE_APROVACAO) podem ser canceladas
        const statusCancelaveis = ['CONFIRMADA', 'PENDENTE_APROVACAO'];
        if (!statusCancelaveis.includes(reserva.status)) {
          throw new ErroDominioReserva(
            'RESERVA_NAO_CANCELAVEL',
            `A reserva já está com status "${reserva.status}" e não pode ser cancelada novamente.`,
            409,
            { statusAtual: reserva.status }
          );
        }

        // RN-05: Validação do prazo de cancelamento (2 horas de antecedência)
        const avaliacaoPrazo = avaliarPrazoCancelamento(reserva, dataHoraReferencia);

        const canceladoPorAdminTerceiro = ehAdmin && !ehDono;
        const statusNovo = canceladoPorAdminTerceiro ? 'CANCELADA_ADMIN' : 'CANCELADA_USUARIO';
        const contabilizaCota =
          canceladoPorAdminTerceiro || reserva.status === 'PENDENTE_APROVACAO'
            ? false
            : avaliacaoPrazo.contabilizaCota;

        const canceladaEm = new Date().toISOString();
        const motivoNormalizado =
          typeof motivo === 'string' && motivo.trim().length > 0
            ? motivo.trim()
            : canceladoPorAdminTerceiro
              ? 'Cancelada pelo administrador'
              : 'Cancelada pelo usuário';

        const reservaAtualizada = tx.atualizarStatusReserva(reservaId, {
          status: statusNovo,
          contabilizaCota,
          canceladaEm,
          motivoCancelamento: motivoNormalizado
        });

        // RN-13: Registro de auditoria obrigatório na mesma transação atômica
        tx.inserirAuditoria({
          reservaId: reserva.id,
          usuarioId: contextoUsuario.id,
          acao: 'CANCELAMENTO_RESERVA',
          statusAnterior: reserva.status,
          statusNovo,
          ipSolicitante,
          detalhes: {
            espacoId: reserva.espacoId,
            data: reserva.data,
            horarioInicio: reserva.horarioInicio,
            horarioFim: reserva.horarioFim,
            codigoConfirmacao: reserva.codigoConfirmacao,
            motivoCancelamento: motivoNormalizado,
            contabilizaCota,
            dentroDoPrazoSemPenalidade: avaliacaoPrazo.dentroDoPrazoSemPenalidade,
            horasAntecedencia: avaliacaoPrazo.horasAntecedencia,
            canceladoPorPerfil: contextoUsuario.perfil || 'ESTUDANTE'
          }
        });

        // Se o administrador cancelou a reserva de outro usuário, registra notificação
        if (canceladoPorAdminTerceiro) {
          this.reservaRepository.registrarNotificacao({
            usuarioId: reserva.usuarioId,
            reservaId: reserva.id,
            tipo: 'RESERVA_CANCELADA_ADMIN',
            assunto: 'Sua reserva foi cancelada pela administração',
            corpo: `Sua reserva do espaço ${reserva.espacoId} em ${reserva.data} das ${reserva.horarioInicio} às ${reserva.horarioFim} foi cancelada pela administração. Motivo: ${motivoNormalizado}`,
            ipSolicitante
          });
        }

        return {
          reserva: reservaAtualizada,
          metaCancelamento: {
            horarioLiberado: true,
            dentroDoPrazoSemPenalidade: avaliacaoPrazo.dentroDoPrazoSemPenalidade,
            contabilizaCota,
            horasAntecedencia: avaliacaoPrazo.horasAntecedencia
          }
        };
      }
    );
  }
}

module.exports = { ReservaService };

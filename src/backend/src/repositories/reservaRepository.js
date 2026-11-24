'use strict';

const crypto = require('node:crypto');

/**
 * Repositório Transacional de Reservas do UNISpace.
 * Suporta execução atômica (tudo-ou-nada) com serialização por espaço (mutex/FOR UPDATE)
 * para garantir a regra RN-10 (duas solicitações simultâneas para o mesmo horário
 * nunca são ambas confirmadas) e rollback integral em caso de falha.
 */
class ReservaRepository {
  constructor(dadosIniciais = {}) {
    this.espacos = new Map();
    this.usuarios = new Map();
    this.reservas = new Map();
    this.bloqueios = [];
    this.auditoria = [];
    this.notificacoes = []; // fila de notificações disparadas por transações (efeito colateral fire-and-forget)
    this._locksPorEspaco = new Map();
    this._falharNaAuditoriaParaTeste = false;

    this._carregarSeed(dadosIniciais);
  }

  _carregarSeed({ espacos = [], usuarios = [], reservas = [], bloqueios = [] }) {
    for (const espaco of espacos) {
      this.espacos.set(espaco.id, { ...espaco });
    }
    for (const usuario of usuarios) {
      this.usuarios.set(usuario.id, { ...usuario });
    }
    for (const reserva of reservas) {
      this.reservas.set(reserva.id, { ...reserva });
    }
    this.bloqueios = bloqueios.map((b) => ({ ...b }));
  }

  /**
   * Adquire trava exclusiva (equivalente ao SELECT ... FOR UPDATE no PostgreSQL)
   * sobre o espaço físico para serializar requisições concorrentes (RN-10).
   */
  async _adquirirLockEspaco(espacoId) {
    while (this._locksPorEspaco.get(espacoId)) {
      await this._locksPorEspaco.get(espacoId);
    }
    let liberarLock;
    const promessaLock = new Promise((resolve) => {
      liberarLock = () => {
        this._locksPorEspaco.delete(espacoId);
        resolve();
      };
    });
    this._locksPorEspaco.set(espacoId, promessaLock);
    return liberarLock;
  }

  /**
   * Executa um bloco transacional atômico (ACID) com snapshot de rollback.
   * Se qualquer operação falhar dentro do callback, o estado do banco retorna
   * exatamente ao estado anterior ao início da transação.
   */
  async executarEmTransacaoAtomica(espacoId, operacaoTransacional) {
    const liberarLock = await this._adquirirLockEspaco(espacoId);

    // Snapshot para garantir atomicidade (Rollback integral em caso de erro)
    const snapshotReservas = new Map(
      Array.from(this.reservas.entries(), ([k, v]) => [k, { ...v }])
    );
    const snapshotAuditoria = this.auditoria.map((a) => ({ ...a }));

    try {
      const resultado = await operacaoTransacional({
        buscarEspacoPorId: (id) => this.buscarEspacoPorId(id),
        buscarUsuarioPorId: (id) => this.usuarios.get(id) || null,
        // T9.1: consultas de reserva dentro da transação (leitura consistente com o snapshot)
        buscarReservaPorId: (id) => this.reservas.get(id) || null,
        atualizarStatusReserva: (id, alteracoes) => {
          const reserva = this.reservas.get(id);
          if (!reserva) return null;
          const atualizada = { ...reserva, ...alteracoes };
          this.reservas.set(id, atualizada);
          return { ...atualizada };
        },
        listarReservasConfirmadasEspacoData: (idEspaco, data) =>
          this.listarReservasConfirmadasEspacoData(idEspaco, data),
        listarBloqueiosAtivosEspacoData: (idEspaco, data) =>
          this.listarBloqueiosAtivosEspacoData(idEspaco, data),
        listarReservasContabilizadasUsuario: (usuarioId) =>
          Array.from(this.reservas.values()).filter(
            (r) =>
              r.usuarioId === usuarioId &&
              r.contabilizaCota === true &&
              (r.status === 'CONFIRMADA' || r.status === 'CONCLUIDA')
          ),
        inserirReserva: (dadosReserva) => {
          const id = dadosReserva.id || crypto.randomUUID();
          const codigoConfirmacao =
            dadosReserva.codigoConfirmacao ||
            `RES-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          const novaReserva = {
            id,
            codigoConfirmacao,
            espacoId: dadosReserva.espacoId,
            usuarioId: dadosReserva.usuarioId,
            data: dadosReserva.data,
            horarioInicio: dadosReserva.horarioInicio,
            horarioFim: dadosReserva.horarioFim,
            duracaoMinutos: dadosReserva.duracaoMinutos,
            numeroParticipantes: dadosReserva.numeroParticipantes,
            finalidade: dadosReserva.finalidade,
            ipSolicitante: dadosReserva.ipSolicitante,
            // T9.1: reserva especial pode nascer com status PENDENTE_APROVACAO;
            // o default mantém o comportamento atual (CONFIRMADA) da T6.2.
            status: dadosReserva.status ?? 'CONFIRMADA',
            contabilizaCota: dadosReserva.contabilizaCota ?? true,
            criadoEm: new Date().toISOString()
          };
          this.reservas.set(id, novaReserva);
          return { ...novaReserva };
        },
        inserirAuditoria: (dadosAuditoria) => {
          if (this._falharNaAuditoriaParaTeste) {
            throw new Error('FALHA_SIMULADA_PERSISTENCIA_AUDITORIA');
          }
          const registro = {
            id: crypto.randomUUID(),
            ...dadosAuditoria,
            dataHora: new Date().toISOString()
          };
          this.auditoria.push(registro);
          return { ...registro };
        }
      });

      return resultado;
    } catch (erro) {
      // ROLLBACK: restaura integralmente os snapshots
      this.reservas = snapshotReservas;
      this.auditoria = snapshotAuditoria;
      throw erro;
    } finally {
      liberarLock();
    }
  }

  /**
   * Busca um espaço pelo ID (fora de transação; leitura para consulta de disponibilidade).
   * @param {string} id
   * @returns {object|null}
   */
  buscarEspacoPorId(id) {
    if (!id) return null;
    return this.espacos.get(id) || null;
  }

  /**
   * Lista os espaços ativos do catálogo (RN-12).
   * @returns {Array<object>}
   */
  listarEspacosAtivos() {
    return Array.from(this.espacos.values()).filter((espaco) => espaco.ativo === true);
  }

  /**
   * Lista as reservas CONFIRMADAS de um espaço em uma data (RN-01).
   * @param {string} espacoId
   * @param {string} data - Formato 'YYYY-MM-DD'
   * @returns {Array<object>}
   */
  listarReservasConfirmadasEspacoData(espacoId, data) {
    return Array.from(this.reservas.values()).filter(
      (reserva) =>
        reserva.espacoId === espacoId &&
        reserva.data === data &&
        reserva.status === 'CONFIRMADA'
    );
  }

  /**
   * Lista os bloqueios ATIVOS que abrangem uma data (RN-06).
   * @param {string} espacoId
   * @param {string} data - Formato 'YYYY-MM-DD'
   * @returns {Array<object>}
   */
  listarBloqueiosAtivosEspacoData(espacoId, data) {
    return this.bloqueios.filter(
      (bloqueio) =>
        bloqueio.espacoId === espacoId &&
        bloqueio.status === 'ATIVO' &&
        bloqueio.dataInicio <= data &&
        bloqueio.dataFim >= data
    );
  }

  /**
   * Busca uma reserva pelo ID (fora de transação; uso em validações prévias e testes).
   * @param {string} id
   * @returns {object|null}
   */
  buscarReservaPorId(id) {
    if (!id) return null;
    return this.reservas.get(id) || null;
  }

  /**
   * Lista reservas com status PENDENTE_APROVACAO (fila do administrador — suporte ao T9.2).
   * @returns {Array<object>}
   */
  listarReservasPendentesAprovacao() {
    return Array.from(this.reservas.values()).filter(
      (r) => r.status === 'PENDENTE_APROVACAO'
    );
  }

  /**
   * Registra uma notificação na fila em memória (efeito colateral fire-and-forget;
   * não entra no rollback de reservas/auditoria).
   * @param {object} notificacao
   * @returns {object}
   */
  registrarNotificacao(notificacao) {
    this.notificacoes.push({ ...notificacao });
    return { ...notificacao };
  }

  /**
   * Atualiza o status e campos relacionados de uma reserva existente.
   * Destinado a ser chamado dentro de `executarEmTransacaoAtomica`; use
   * `tx.atualizarStatusReserva` para consistência com o snapshot/rollback.
   * @param {string} id
   * @param {object} alteracoes - ex.: { status, motivoCancelamento, canceladaEm }
   * @returns {object|null}
   */
  atualizarStatusReserva(id, alteracoes) {
    const reserva = this.reservas.get(id);
    if (!reserva) return null;
    const atualizada = { ...reserva, ...alteracoes };
    this.reservas.set(id, atualizada);
    return { ...atualizada };
  }
}

module.exports = { ReservaRepository };

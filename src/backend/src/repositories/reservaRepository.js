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
        buscarEspacoPorId: (id) => this.espacos.get(id) || null,
        buscarUsuarioPorId: (id) => this.usuarios.get(id) || null,
        listarReservasConfirmadasEspacoData: (idEspaco, data) =>
          Array.from(this.reservas.values()).filter(
            (r) => r.espacoId === idEspaco && r.data === data && r.status === 'CONFIRMADA'
          ),
        listarBloqueiosAtivosEspacoData: (idEspaco, data) =>
          this.bloqueios.filter(
            (b) =>
              b.espacoId === idEspaco &&
              b.status === 'ATIVO' &&
              b.dataInicio <= data &&
              b.dataFim >= data
          ),
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
            ...dadosReserva,
            status: 'CONFIRMADA',
            contabilizaCota: true,
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
}

module.exports = { ReservaRepository };

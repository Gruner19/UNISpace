'use strict';

const { ErroDominioReserva } = require('../utils/errosDominio');
const {
  validarIdReserva,
  validarPayloadRejeicaoReserva,
  validarPayloadCancelamentoReserva
} = require('../validators/reservaValidator');

class ReservaController {
  /**
   * @param {import('../services/reservaService').ReservaService} reservaService
   */
  constructor(reservaService) {
    this.reservaService = reservaService;
    this.criarReserva = this.criarReserva.bind(this);
    this.aprovarReserva = this.aprovarReserva.bind(this);
    this.rejeitarReserva = this.rejeitarReserva.bind(this);
    this.cancelarReserva = this.cancelarReserva.bind(this);
  }

  /**
   * Handler para POST /api/v1/reservas (compatível com Express e HTTP nativo).
   */
  async criarReserva(req, res) {
    try {
      const usuarioAutenticado = req.usuario || {
        id: req.headers['x-usuario-id'],
        email: req.headers['x-usuario-email'],
        perfil: req.headers['x-usuario-perfil'] || 'ESTUDANTE',
        ip: req.socket?.remoteAddress || '127.0.0.1'
      };

      const reserva = await this.reservaService.criarReservaAtomica(
        req.body,
        usuarioAutenticado
      );

      return this._enviarJson(res, 201, {
        sucesso: true,
        mensagem: 'Reserva criada e confirmada com sucesso.',
        dados: reserva
      });
    } catch (erro) {
      if (erro instanceof ErroDominioReserva) {
        return this._enviarJson(res, erro.statusHttp, {
          sucesso: false,
          erro: {
            codigo: erro.codigo,
            mensagem: erro.mensagem,
            detalhes: erro.detalhes
          }
        });
      }

      return this._enviarJson(res, 500, {
        sucesso: false,
        erro: {
          codigo: 'ERRO_INTERNO_TRANSACAO',
          mensagem: 'Ocorreu um erro interno ao processar a reserva. Nenhuma alteração foi persistida.'
        }
      });
    }
  }

  /**
   * Handler para POST /api/v1/reservas/:reservaId/aprovar (apenas ADMINISTRADOR).
   * T9.1: aprova reserva especial com status PENDENTE_APROVACAO.
   */
  async aprovarReserva(req, res) {
    try {
      const usuarioAutenticado = req.usuario || {
        id: req.headers['x-usuario-id'],
        email: req.headers['x-usuario-email'],
        perfil: req.headers['x-usuario-perfil'] || 'ESTUDANTE',
        ip: req.socket?.remoteAddress || '127.0.0.1'
      };

      validarIdReserva(req.params?.reservaId);

      const reserva = await this.reservaService.aprovarReserva(
        req.params.reservaId,
        usuarioAutenticado,
        usuarioAutenticado.ip
      );

      return this._enviarJson(res, 200, {
        sucesso: true,
        mensagem: 'Reserva aprovada com sucesso.',
        dados: reserva
      });
    } catch (erro) {
      if (erro instanceof ErroDominioReserva) {
        return this._enviarJson(res, erro.statusHttp, {
          sucesso: false,
          erro: {
            codigo: erro.codigo,
            mensagem: erro.mensagem,
            detalhes: erro.detalhes
          }
        });
      }

      return this._enviarJson(res, 500, {
        sucesso: false,
        erro: {
          codigo: 'ERRO_INTERNO_APROVACAO',
          mensagem: 'Ocorreu um erro interno ao aprovar a reserva. Nenhuma alteração foi persistida.'
        }
      });
    }
  }

  /**
   * Handler para POST /api/v1/reservas/:reservaId/rejeitar (apenas ADMINISTRADOR).
   * T9.1: rejeita reserva especial com status PENDENTE_APROVACAO.
   */
  async rejeitarReserva(req, res) {
    try {
      const usuarioAutenticado = req.usuario || {
        id: req.headers['x-usuario-id'],
        email: req.headers['x-usuario-email'],
        perfil: req.headers['x-usuario-perfil'] || 'ESTUDANTE',
        ip: req.socket?.remoteAddress || '127.0.0.1'
      };

      validarIdReserva(req.params?.reservaId);
      validarPayloadRejeicaoReserva(req.body);

      const reserva = await this.reservaService.rejeitarReserva(
        req.params.reservaId,
        usuarioAutenticado,
        req.body?.motivo,
        usuarioAutenticado.ip
      );

      return this._enviarJson(res, 200, {
        sucesso: true,
        mensagem: 'Reserva rejeitada.',
        dados: reserva
      });
    } catch (erro) {
      if (erro instanceof ErroDominioReserva) {
        return this._enviarJson(res, erro.statusHttp, {
          sucesso: false,
          erro: {
            codigo: erro.codigo,
            mensagem: erro.mensagem,
            detalhes: erro.detalhes
          }
        });
      }

      return this._enviarJson(res, 500, {
        sucesso: false,
        erro: {
          codigo: 'ERRO_INTERNO_REJEICAO',
          mensagem: 'Ocorreu um erro interno ao rejeitar a reserva. Nenhuma alteração foi persistida.'
        }
      });
    }
  }

  /**
   * Handler para DELETE /api/v1/reservas/:reservaId e PUT /api/v1/reservas/:reservaId/cancelar.
   * T7.1: cancela reserva permitindo apenas ao titular ou administrador (RN-11),
   * aplicando a política de prazo de 2h (RN-05), liberando o horário e registrando auditoria (RN-13).
   */
  async cancelarReserva(req, res) {
    try {
      const usuarioAutenticado = req.usuario || {
        id: req.headers['x-usuario-id'],
        email: req.headers['x-usuario-email'],
        perfil: req.headers['x-usuario-perfil'] || 'ESTUDANTE',
        ip: req.socket?.remoteAddress || '127.0.0.1'
      };

      validarIdReserva(req.params?.reservaId);
      validarPayloadCancelamentoReserva(req.body);

      const { reserva, metaCancelamento } = await this.reservaService.cancelarReserva(
        req.params.reservaId,
        usuarioAutenticado,
        req.body?.motivo,
        {
          ipSolicitante: usuarioAutenticado.ip,
          dataHoraReferencia: req.dataHoraReferencia || undefined
        }
      );

      const mensagem = metaCancelamento.contabilizaCota
        ? 'Reserva cancelada com menos de 2h de antecedência. O horário foi liberado, mas as horas continuam contabilizadas na cota semanal (RN-05).'
        : 'Reserva cancelada com sucesso. O horário foi liberado e as horas foram devolvidas à sua cota semanal.';

      return this._enviarJson(res, 200, {
        sucesso: true,
        mensagem,
        reservaId: reserva.id,
        dados: reserva,
        meta: metaCancelamento
      });
    } catch (erro) {
      if (erro instanceof ErroDominioReserva) {
        return this._enviarJson(res, erro.statusHttp, {
          sucesso: false,
          mensagem: erro.mensagem,
          erro: {
            codigo: erro.codigo,
            mensagem: erro.mensagem,
            detalhes: erro.detalhes
          }
        });
      }

      return this._enviarJson(res, 500, {
        sucesso: false,
        mensagem: 'Ocorreu um erro interno ao cancelar a reserva. Nenhuma alteração foi persistida.',
        erro: {
          codigo: 'ERRO_INTERNO_CANCELAMENTO',
          mensagem: 'Ocorreu um erro interno ao cancelar a reserva. Nenhuma alteração foi persistida.'
        }
      });
    }
  }

  _enviarJson(res, statusCode, payload) {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(statusCode).json(payload);
    }
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
  }
}

module.exports = { ReservaController };

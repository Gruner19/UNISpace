'use strict';

const { ErroDominioReserva } = require('../utils/errosDominio');

class ReservaController {
  /**
   * @param {import('../services/reservaService').ReservaService} reservaService
   */
  constructor(reservaService) {
    this.reservaService = reservaService;
    this.criarReserva = this.criarReserva.bind(this);
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

  _enviarJson(res, statusCode, payload) {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(statusCode).json(payload);
    }
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
  }
}

module.exports = { ReservaController };

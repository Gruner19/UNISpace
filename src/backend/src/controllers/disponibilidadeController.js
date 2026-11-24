'use strict';

const { ErroDominioReserva } = require('../utils/errosDominio');
const { validarConsultaDisponibilidade } = require('../validators/disponibilidadeValidator');

class DisponibilidadeController {
  /**
   * @param {import('../services/disponibilidadeService').DisponibilidadeService} disponibilidadeService
   */
  constructor(disponibilidadeService) {
    this.disponibilidadeService = disponibilidadeService;
    this.consultarDisponibilidade = this.consultarDisponibilidade.bind(this);
  }

  /**
   * Handler para GET /api/v1/espacos/disponibilidade (compatível com Express e HTTP nativo).
   */
  async consultarDisponibilidade(req, res) {
    try {
      const filtros = validarConsultaDisponibilidade(req.query || {});
      const agenda = await this.disponibilidadeService.consultarDisponibilidade(filtros);

      return this._enviarJson(res, 200, {
        sucesso: true,
        mensagem:
          agenda.totalEspacos === 0
            ? 'Nenhum espaço encontrado com os filtros aplicados.'
            : 'Consulta de disponibilidade realizada com sucesso.',
        dados: agenda
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
          codigo: 'ERRO_INTERNO_DISPONIBILIDADE',
          mensagem:
            'Não foi possível consultar a disponibilidade no momento. Tente novamente em alguns instantes.'
        }
      });
    }
  }

  _enviarJson(res, statusCode, payload) {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(statusCode).json(payload);
    }
    const corpo = JSON.stringify(payload);
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(corpo)
    });
    res.end(corpo);
  }
}

module.exports = { DisponibilidadeController };

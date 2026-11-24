'use strict';

const { ErroDominioReserva } = require('../utils/errosDominio');

class PrioridadeController {
  /**
   * @param {import('../services/prioridadeService').PrioridadeService} prioridadeService
   */
  constructor(prioridadeService) {
    this.prioridadeService = prioridadeService;
    this.consultarPrioridadeAtual = this.consultarPrioridadeAtual.bind(this);
    this.calcularPrioridadeSemanal = this.calcularPrioridadeSemanal.bind(this);
  }

  /**
   * Handler para GET /api/v1/prioridades/atual
   * Query opcional: ?espacoId=...&semana=YYYY-MM-DD
   */
  async consultarPrioridadeAtual(req, res) {
    try {
      const filtros = {
        espacoId: req.query?.espacoId || undefined,
        semana: req.query?.semana || undefined
      };

      const resultado = this.prioridadeService.obterPrioridadeAtual(
        filtros,
        req.dataHoraReferencia || new Date()
      );

      return this._enviarJson(res, 200, {
        sucesso: true,
        dados: resultado
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
        mensagem: 'Ocorreu um erro interno ao consultar a prioridade rotativa.',
        erro: {
          codigo: 'ERRO_INTERNO_PRIORIDADE',
          mensagem: 'Ocorreu um erro interno ao consultar a prioridade rotativa.'
        }
      });
    }
  }

  /**
   * Handler para POST /api/v1/prioridades/calcular (apenas ADMINISTRADOR)
   * Body: { espacoId, semanaReferencia?, aberturaAgendaEm? }
   */
  async calcularPrioridadeSemanal(req, res) {
    try {
      const { espacoId, semanaReferencia, aberturaAgendaEm } = req.body || {};
      if (!espacoId) {
        throw new ErroDominioReserva(
          'CAMPO_OBRIGATORIO',
          'O campo "espacoId" é obrigatório para calcular a prioridade semanal.',
          400
        );
      }

      const resultado = this.prioridadeService.calcularPrioridadeSemanal(
        espacoId,
        semanaReferencia || req.dataHoraReferencia || new Date(),
        {
          aberturaAgendaEm,
          usuarioExecutorId: req.usuario?.id,
          ipSolicitante: req.usuario?.ip || req.socket?.remoteAddress || '127.0.0.1',
          dataHoraReferencia: req.dataHoraReferencia || new Date()
        }
      );

      return this._enviarJson(res, 201, {
        sucesso: true,
        mensagem: 'Prioridade rotativa semanal calculada com sucesso.',
        dados: resultado
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
        mensagem: 'Ocorreu um erro interno ao calcular a prioridade rotativa.',
        erro: {
          codigo: 'ERRO_INTERNO_PRIORIDADE',
          mensagem: 'Ocorreu um erro interno ao calcular a prioridade rotativa.'
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

module.exports = { PrioridadeController };

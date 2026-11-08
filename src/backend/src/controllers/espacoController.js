'use strict';

const { EspacoService } = require('../services/espacoService');

class EspacoController {
  constructor(espacoService) {
    this.espacoService = espacoService;
    this.listarEspacos = this.listarEspacos.bind(this);
  }

  /** 
   * Handler para GET /api/v1/espacos.
   * Retorna o catálogo de espaços de teste para a tela de agenda do frontend.
   */
  async listarEspacos(req, res) {
    try {
      const espaços = this.espacoService.listarEspacos();
      return this._enviarJson(res, 200, {
        sucesso: true,
        dados: espaços
      });
    } catch (erro) {
      return this._enviarJson(res, 500, {
        sucesso: false,
        erro: {
          codigo: 'ERRO_INTERNO_LISTAR_ESPACOS',
          mensagem: 'Ocorreu um erro interno ao listar os espaços.'
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

module.exports = { EspacoController };
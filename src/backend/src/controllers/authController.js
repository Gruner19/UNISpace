const { ErroDominioReserva } = require('../utils/errosDominio');

class AuthController {
  /**
   * @param {object} authService
   */
  constructor(authService) {
    this.authService = authService;
    this.login = this.login.bind(this);
  }

  /**
   * Trata a requisição de login: POST /api/v1/auth/login
   * @param {object} req
   * @param {object} res
   */
  async login(req, res) {
    try {
      const payload = req.body || {};
      const resultado = await this.authService.login(payload);

      return this._enviarJson(res, 200, {
        sucesso: true,
        mensagem: 'Autenticação realizada com sucesso.',
        dados: resultado
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

      console.error('[AuthController.login] Erro inesperado:', erro);
      return this._enviarJson(res, 500, {
        sucesso: false,
        erro: {
          codigo: 'ERRO_INTERNO_SERVIDOR',
          mensagem: 'Ocorreu um erro interno ao processar a autenticação.'
        }
      });
    }
  }

  /**
   * Suporte híbrido a Express (res.status().json()) e HTTP nativo (res.writeHead/end).
   * @private
   */
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

module.exports = {
  AuthController
};

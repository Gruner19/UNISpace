'use strict';

class ErroDominioReserva extends Error {
  /**
   * @param {string} codigo - Código semântico do erro (ex.: 'CONFLITO_HORARIO')
   * @param {string} mensagem - Mensagem clara e amigável ao usuário
   * @param {number} statusHttp - Código HTTP correspondente (400, 401, 403, 404, 409, 422)
   * @param {object} [detalhes] - Metadados adicionais da validação
   */
  constructor(codigo, mensagem, statusHttp = 400, detalhes = {}) {
    super(mensagem);
    this.name = 'ErroDominioReserva';
    this.codigo = codigo;
    this.statusHttp = statusHttp;
    this.detalhes = detalhes;
  }
}

module.exports = { ErroDominioReserva };

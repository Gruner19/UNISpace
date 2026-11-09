const { validarEmailInstitucional } = require('./reservaValidator');
const { ErroDominioReserva } = require('../utils/errosDominio');

/**
 * Valida o payload de login.
 * Garante e-mail institucional válido (RN-02) e senha preenchida.
 * @param {object} payload - Dados de login { email, senha }.
 */
function validarPayloadLogin(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new ErroDominioReserva(
      'CORPO_REQUISICAO_INVALIDO',
      'O corpo da requisição deve ser um objeto JSON válido.',
      400
    );
  }

  const { email, senha } = payload;

  if (!email || typeof email !== 'string' || !email.trim()) {
    throw new ErroDominioReserva(
      'EMAIL_OBRIGATORIO',
      'O e-mail institucional é obrigatório.',
      400
    );
  }

  const emailFormatado = email.trim().toLowerCase();

  // Validação do e-mail com regex básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailFormatado)) {
    throw new ErroDominioReserva(
      'EMAIL_FORMATO_INVALIDO',
      'O e-mail informado não possui um formato válido.',
      400
    );
  }

  // RN-02: Deve ser e-mail com domínio institucional aceito
  if (!validarEmailInstitucional(emailFormatado)) {
    throw new ErroDominioReserva(
      'EMAIL_NAO_INSTITUCIONAL',
      'Apenas membros da comunidade com e-mail institucional válido podem autenticar-se.',
      400,
      { email: emailFormatado }
    );
  }

  if (!senha || typeof senha !== 'string' || !senha.trim()) {
    throw new ErroDominioReserva(
      'SENHA_OBRIGATORIA',
      'A senha é obrigatória.',
      400
    );
  }

  return {
    email: emailFormatado,
    senha
  };
}

module.exports = {
  validarPayloadLogin
};

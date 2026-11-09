const crypto = require('node:crypto');

const ITERACOES = 100000;
const TAMANHO_CHAVE = 64;
const DIGEST = 'sha512';

/**
 * Gera um hash seguro para a senha informada usando PBKDF2.
 * @param {string} senha - Senha em texto plano.
 * @returns {string} Formato "salt:hash" em hexadecimal.
 */
function gerarHashSenha(senha) {
  if (!senha || typeof senha !== 'string') {
    throw new TypeError('A senha deve ser uma string não vazia');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(senha, salt, ITERACOES, TAMANHO_CHAVE, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Compara uma senha em texto plano com o hash salvo no formato "salt:hash".
 * @param {string} senha - Senha fornecida para conferência.
 * @param {string} senhaHash - Hash no formato "salt:hash".
 * @returns {boolean} True se a senha corresponder ao hash.
 */
function verificarSenha(senha, senhaHash) {
  if (!senha || !senhaHash || typeof senha !== 'string' || typeof senhaHash !== 'string') {
    return false;
  }
  const partes = senhaHash.split(':');
  if (partes.length !== 2) {
    return false;
  }
  const [salt, hashOriginal] = partes;
  const hashCalculado = crypto.pbkdf2Sync(senha, salt, ITERACOES, TAMANHO_CHAVE, DIGEST).toString('hex');

  const bufOriginal = Buffer.from(hashOriginal, 'hex');
  const bufCalculado = Buffer.from(hashCalculado, 'hex');

  if (bufOriginal.length !== bufCalculado.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufOriginal, bufCalculado);
}

module.exports = {
  gerarHashSenha,
  verificarSenha
};

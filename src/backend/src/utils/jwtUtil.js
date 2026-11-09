const crypto = require('node:crypto');
const { config } = require('../config/env');

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function converterTempoParaSegundos(expiracaoStr) {
  if (typeof expiracaoStr === 'number') return expiracaoStr;
  const match = String(expiracaoStr).match(/^(-?\d+)([smhd])?$/);
  if (!match) return 86400; // 1d padrão
  const valor = Number.parseInt(match[1], 10);
  const unidade = match[2] || 's';
  switch (unidade) {
    case 's': return valor;
    case 'm': return valor * 60;
    case 'h': return valor * 3600;
    case 'd': return valor * 86400;
    default: return 86400;
  }
}

/**
 * Gera um token JWT assinado com HMAC-SHA256.
 * @param {object} payload - Dados contidos no token.
 * @param {string} [secret] - Segredo para assinatura.
 * @param {string|number} [expiresIn] - Tempo de expiração (ex.: "1d", "2h", 3600).
 * @returns {string} Token JWT.
 */
function gerarToken(payload, secret = config.jwtSecret, expiresIn = config.jwtExpiresIn) {
  const chave = secret || 'unispace-secret-key-fallback';
  const agoraSegundos = Math.floor(Date.now() / 1000);
  const segundosValidade = converterTempoParaSegundos(expiresIn);

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payloadCompleto = {
    ...payload,
    iat: agoraSegundos,
    exp: agoraSegundos + segundosValidade
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payloadCompleto));
  const dadosParaAssinar = `${headerEncoded}.${payloadEncoded}`;

  const assinatura = crypto
    .createHmac('sha256', chave)
    .update(dadosParaAssinar)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dadosParaAssinar}.${assinatura}`;
}

/**
 * Verifica e decodifica um token JWT. Lança erro se inválido ou expirado.
 * @param {string} token - Token JWT.
 * @param {string} [secret] - Segredo de verificação.
 * @returns {object} Payload decodificado.
 */
function verificarToken(token, secret = config.jwtSecret) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token não fornecido ou inválido');
  }

  const partes = token.split('.');
  if (partes.length !== 3) {
    throw new Error('Formato de token inválido');
  }

  const [headerEncoded, payloadEncoded, assinaturaFornecida] = partes;
  const chave = secret || 'unispace-secret-key-fallback';
  const dadosParaAssinar = `${headerEncoded}.${payloadEncoded}`;

  const assinaturaEsperada = crypto
    .createHmac('sha256', chave)
    .update(dadosParaAssinar)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const bufFornecido = Buffer.from(assinaturaFornecida);
  const bufEsperado = Buffer.from(assinaturaEsperada);

  if (bufFornecido.length !== bufEsperado.length || !crypto.timingSafeEqual(bufFornecido, bufEsperado)) {
    throw new Error('Assinatura de token inválida');
  }

  const payloadDecodificado = JSON.parse(base64UrlDecode(payloadEncoded));
  const agoraSegundos = Math.floor(Date.now() / 1000);

  if (payloadDecodificado.exp !== undefined && payloadDecodificado.exp <= agoraSegundos) {
    throw new Error('Token expirado');
  }

  return payloadDecodificado;
}

/**
 * Extrai o token do cabeçalho Authorization no formato "Bearer <token>".
 * @param {string} authHeader - Cabeçalho HTTP Authorization.
 * @returns {string|null} Token extraído ou null se ausente/inválido.
 */
function extrairTokenDoHeader(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  const [tipo, token] = authHeader.trim().split(/\s+/);
  if (tipo?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token;
}

module.exports = {
  gerarToken,
  verificarToken,
  extrairTokenDoHeader
};

const { verificarToken, extrairTokenDoHeader } = require('../utils/jwtUtil');
const { ErroDominioReserva } = require('../utils/errosDominio');

/**
 * Middleware para extrair e autenticar o token JWT presente no cabeçalho Authorization.
 * Adiciona req.usuario com os dados do token decodificado caso válido.
 * @param {object} req
 * @param {object} res
 * @param {Function} [next]
 * @returns {boolean} Retorna true se autenticado com sucesso ou se o cabeçalho não exige rejeição imediata no modo opcional.
 */
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = extrairTokenDoHeader(authHeader);

  if (!token) {
    const erro = {
      sucesso: false,
      erro: {
        codigo: 'TOKEN_NAO_FORNECIDO',
        mensagem: 'Token de autenticação não fornecido no cabeçalho Authorization (formato esperado: "Bearer <token>").'
      }
    };
    _enviarRespostaErro(res, 401, erro);
    return false;
  }

  try {
    const usuarioDecodificado = verificarToken(token);
    req.usuario = usuarioDecodificado;
    if (typeof next === 'function') {
      next();
    }
    return true;
  } catch (erro) {
    const erroPayload = {
      sucesso: false,
      erro: {
        codigo: 'TOKEN_INVALIDO',
        mensagem: erro.message === 'Token expirado' ? 'Token de autenticação expirado.' : 'Token de autenticação inválido.'
      }
    };
    _enviarRespostaErro(res, 401, erroPayload);
    return false;
  }
}

/**
 * Middleware opcional: se o token estiver presente, decodifica e preenche req.usuario;
 * se não estiver, prossegue sem erro (permitindo fallback para headers de desenvolvimento).
 */
function identificarUsuarioOpcional(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = extrairTokenDoHeader(authHeader);
  if (!token) {
    return null;
  }
  try {
    const usuarioDecodificado = verificarToken(token);
    req.usuario = usuarioDecodificado;
    return usuarioDecodificado;
  } catch {
    return null;
  }
}

function _enviarRespostaErro(res, status, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(payload);
  }
  const corpo = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(corpo)
  });
  res.end(corpo);
}

module.exports = {
  autenticarToken,
  identificarUsuarioOpcional
};

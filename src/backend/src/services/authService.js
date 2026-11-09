const { validarPayloadLogin } = require('../validators/authValidator');
const { verificarSenha } = require('../utils/senhaUtil');
const { gerarToken } = require('../utils/jwtUtil');
const { ErroDominioReserva } = require('../utils/errosDominio');

class AuthService {
  /**
   * @param {object} usuarioRepository
   */
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  /**
   * Realiza a autenticação do usuário.
   * @param {object} payload - { email, senha }
   * @returns {Promise<object>} Objeto contendo o token de acesso e os dados públicos do usuário.
   */
  async login(payload) {
    const { email, senha } = validarPayloadLogin(payload);

    const usuario = this.usuarioRepository.buscarPorEmail(email);

    // Mensagem genérica para evitar enumeração de contas
    if (!usuario) {
      throw new ErroDominioReserva(
        'CREDENCIAS_INVALIDAS',
        'E-mail institucional ou senha incorretos.',
        401
      );
    }

    if (usuario.ativo === false) {
      throw new ErroDominioReserva(
        'USUARIO_INATIVO',
        'Conta de usuário desativada. Entre em contato com a administração.',
        403
      );
    }

    if (!usuario.senhaHash) {
      throw new ErroDominioReserva(
        'CREDENCIAS_INVALIDAS',
        'E-mail institucional ou senha incorretos.',
        401
      );
    }

    const senhaCorreta = verificarSenha(senha, usuario.senhaHash);
    if (!senhaCorreta) {
      throw new ErroDominioReserva(
        'CREDENCIAS_INVALIDAS',
        'E-mail institucional ou senha incorretos.',
        401
      );
    }

    const payloadToken = {
      id: usuario.id,
      email: usuario.emailInstitucional,
      perfil: usuario.perfil || 'ESTUDANTE'
    };

    const token = gerarToken(payloadToken);

    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.emailInstitucional,
        perfil: usuario.perfil
      }
    };
  }
}

module.exports = {
  AuthService
};

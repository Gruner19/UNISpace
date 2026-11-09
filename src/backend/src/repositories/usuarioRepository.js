class UsuarioRepository {
  /**
   * @param {Array<object>} usuariosIniciais
   */
  constructor(usuariosIniciais = []) {
    this._usuarios = new Map(
      usuariosIniciais.map((usuario) => [usuario.id, { ...usuario }])
    );
  }

  /**
   * Busca um usuário pelo e-mail institucional exato (case-insensitive).
   * @param {string} email
   * @returns {object|null}
   */
  buscarPorEmail(email) {
    if (!email) return null;
    const emailNormalizado = email.trim().toLowerCase();
    for (const usuario of this._usuarios.values()) {
      if (usuario.emailInstitucional?.toLowerCase() === emailNormalizado) {
        return { ...usuario };
      }
    }
    return null;
  }

  /**
   * Busca um usuário pelo ID único.
   * @param {string} id
   * @returns {object|null}
   */
  buscarPorId(id) {
    if (!id || !this._usuarios.has(id)) {
      return null;
    }
    return { ...this._usuarios.get(id) };
  }

  /**
   * Lista todos os usuários cadastrados.
   * @returns {Array<object>}
   */
  listarTodos() {
    return Array.from(this._usuarios.values()).map((u) => ({ ...u }));
  }

  /**
   * Insere um novo usuário na base em memória.
   * @param {object} usuario
   * @returns {object} Usuário criado
   */
  inserir(usuario) {
    this._usuarios.set(usuario.id, { ...usuario });
    return { ...usuario };
  }
}

module.exports = {
  UsuarioRepository
};

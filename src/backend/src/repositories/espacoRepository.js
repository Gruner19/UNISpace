'use strict';

/**
 * Repositório de Espaços do UNISpace.
 * Gerencia o catálogo de espaços físicos (aulas, laboratórios, auditórios, quadras)
 * em memória para uso das camadas de serviço e controle.
 */
class EspacoRepository {
  constructor(dadosIniciais = {}) {
    this.espacos = new Map();
    this._carregarSeed(dadosIniciais);
  }

  _carregarSeed({ espacos = [] } = {}) {
    for (const espaco of espacos) {
      this.espacos.set(espaco.id, { ...espaco });
    }
  }

  /**
   * Lista todos os espaços disponíveis no catálogo.
   * @returns {Array<object>} Array de objetos com { id, nome, tipo, capacidade }
   */
  listarEspacos() {
    const resultado = [];
    for (const espaco of this.espacos.values()) {
      resultado.push({
        id: espaco.id,
        nome: espaco.nome,
        tipo: espaco.tipo,
        capacidade: espaco.capacidade
      });
    }
    return resultado;
  }
}

module.exports = { EspacoRepository };
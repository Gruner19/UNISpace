'use strict';

const { EspacoRepository } = require('../repositories/espacoRepository');

class EspacoService {
  constructor(repositorio = new EspacoRepository()) {
    this.repositorio = repositorio;
  }

  /** 
   * Lista todos os espaços do catálogo de prova.
   * @returns {Array<object>} Array de espaços com { id, nome, tipo, capacidade }
   */
  listarEspacos() {
    return this.repositorio.listarEspacos();
  }
}

module.exports = { EspacoService };
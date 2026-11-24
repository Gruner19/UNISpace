'use strict';

const crypto = require('node:crypto');

/**
 * Repositório em memória para Cursos e Escalas de Prioridade Rotativa (RN-04 / P2.2).
 */
class PrioridadeRepository {
  /**
   * @param {{ cursos?: Array<object>, prioridadesRotativas?: Array<object> }} [dadosIniciais]
   */
  constructor(dadosIniciais = {}) {
    this.cursos = new Map();
    this.prioridadesRotativas = new Map();

    for (const curso of dadosIniciais.cursos || []) {
      this.cursos.set(curso.id, { ...curso });
    }
    for (const prioridade of dadosIniciais.prioridadesRotativas || []) {
      const chave = this._chave(prioridade.espacoId, prioridade.semanaReferencia);
      this.prioridadesRotativas.set(chave, { ...prioridade });
    }
  }

  _chave(espacoId, semanaReferencia) {
    return `${espacoId}::${semanaReferencia}`;
  }

  listarCursos() {
    return Array.from(this.cursos.values()).map((c) => ({ ...c }));
  }

  buscarCursoPorId(cursoId) {
    const curso = this.cursos.get(cursoId);
    return curso ? { ...curso } : null;
  }

  salvarPrioridade(dadosPrioridade) {
    const chave = this._chave(dadosPrioridade.espacoId, dadosPrioridade.semanaReferencia);
    const registro = {
      id: dadosPrioridade.id || crypto.randomUUID(),
      ...dadosPrioridade,
      criadoEm: dadosPrioridade.criadoEm || new Date().toISOString()
    };
    this.prioridadesRotativas.set(chave, registro);
    return { ...registro };
  }

  buscarPrioridade(espacoId, semanaReferencia) {
    const registro = this.prioridadesRotativas.get(this._chave(espacoId, semanaReferencia));
    return registro ? { ...registro } : null;
  }

  listarPrioridadesPorSemana(semanaReferencia) {
    return Array.from(this.prioridadesRotativas.values())
      .filter((p) => p.semanaReferencia === semanaReferencia)
      .map((p) => ({ ...p }));
  }
}

module.exports = { PrioridadeRepository };

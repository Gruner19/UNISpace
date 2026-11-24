'use strict';

/**
 * Repositório de leitura da consulta de disponibilidade (T5.1 / CU-02).
 * Reutiliza o armazenamento do ReservaRepository, garantindo que a agenda
 * enxergue exatamente as reservas e os bloqueios gravados pelas transações.
 */
class DisponibilidadeRepository {
  /**
   * @param {import('./reservaRepository').ReservaRepository} reservaRepository
   */
  constructor(reservaRepository) {
    if (!reservaRepository) {
      throw new Error('DisponibilidadeRepository requer um ReservaRepository.');
    }
    this.reservaRepository = reservaRepository;
  }

  /**
   * @param {string} espacoId
   * @returns {object|null}
   */
  buscarEspacoPorId(espacoId) {
    return this.reservaRepository.buscarEspacoPorId(espacoId);
  }

  /**
   * @returns {Array<object>} Espaços com `ativo === true` (RN-12)
   */
  listarEspacosAtivos() {
    return this.reservaRepository.listarEspacosAtivos();
  }

  /**
   * @param {string} espacoId
   * @param {string} data - Formato 'YYYY-MM-DD'
   * @returns {Array<object>} Reservas CONFIRMADAS do espaço na data (RN-01)
   */
  listarReservasConfirmadasEspacoData(espacoId, data) {
    return this.reservaRepository.listarReservasConfirmadasEspacoData(espacoId, data);
  }

  /**
   * @param {string} espacoId
   * @param {string} data - Formato 'YYYY-MM-DD'
   * @returns {Array<object>} Bloqueios ATIVOS que abrangem a data (RN-06)
   */
  listarBloqueiosAtivosEspacoData(espacoId, data) {
    return this.reservaRepository.listarBloqueiosAtivosEspacoData(espacoId, data);
  }
}

module.exports = { DisponibilidadeRepository };

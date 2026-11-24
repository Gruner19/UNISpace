'use strict';

/**
 * Registra as rotas de consulta de disponibilidade em uma instância Express Router ou aplicação compatível.
 * @param {object} router - Instância de Express Router / App
 * @param {import('../controllers/disponibilidadeController').DisponibilidadeController} disponibilidadeController
 */
function registrarRotasDisponibilidade(router, disponibilidadeController) {
  // T5.1: agenda única com filtros por espaço, tipo, data/período e horário
  router.get(
    '/api/v1/espacos/disponibilidade',
    disponibilidadeController.consultarDisponibilidade
  );
  return router;
}

module.exports = { registrarRotasDisponibilidade };

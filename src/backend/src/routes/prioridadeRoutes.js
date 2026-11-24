'use strict';

/**
 * Registra as rotas de prioridade rotativa (P2.2 / RN-04).
 * @param {object} router
 * @param {import('../controllers/prioridadeController').PrioridadeController} prioridadeController
 */
function registrarRotasPrioridade(router, prioridadeController) {
  router.get('/api/v1/prioridades/atual', prioridadeController.consultarPrioridadeAtual);
  router.post('/api/v1/prioridades/calcular', prioridadeController.calcularPrioridadeSemanal);
  return router;
}

module.exports = { registrarRotasPrioridade };

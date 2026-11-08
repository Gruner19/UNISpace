'use strict';

/**
 * Registra as rotas de espaços em uma instância Express Router ou aplicação compatível.
 * @param {object} router - Instância de Express Router / App
 * @param {import('../controllers/espacoController').EspacoController} espacoController
 */
function registrarRotasEspacos(router, espacoController) {
  router.get('/api/v1/espacos', espacoController.listarEspacos);
  return router;
}

module.exports = { registrarRotasEspacos };
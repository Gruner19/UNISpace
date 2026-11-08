'use strict';

/**
 * Registra as rotas de reserva em uma instância Express Router ou aplicação compatível.
 * @param {object} router - Instância de Express Router / App
 * @param {import('../controllers/reservaController').ReservaController} reservaController
 */
function registrarRotasReserva(router, reservaController) {
  router.post('/api/v1/reservas', reservaController.criarReserva);
  return router;
}

module.exports = { registrarRotasReserva };

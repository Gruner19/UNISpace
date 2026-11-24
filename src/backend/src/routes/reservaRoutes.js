'use strict';

/**
 * Registra as rotas de reserva em uma instância Express Router ou aplicação compatível.
 * @param {object} router - Instância de Express Router / App
 * @param {import('../controllers/reservaController').ReservaController} reservaController
 */
function registrarRotasReserva(router, reservaController) {
  router.post('/api/v1/reservas', reservaController.criarReserva);
  // T9.1: aprovação e rejeição de reservas especiais (apenas administrador)
  router.post('/api/v1/reservas/:reservaId/aprovar', reservaController.aprovarReserva);
  router.post('/api/v1/reservas/:reservaId/rejeitar', reservaController.rejeitarReserva);
  return router;
}

module.exports = { registrarRotasReserva };

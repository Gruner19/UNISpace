/**
 * Registra as rotas de autenticação (compatível com Express router se adotado no futuro).
 * @param {object} router
 * @param {object} authController
 */
function registrarRotasAuth(router, authController) {
  router.post('/api/v1/auth/login', authController.login);
  return router;
}

module.exports = {
  registrarRotasAuth
};

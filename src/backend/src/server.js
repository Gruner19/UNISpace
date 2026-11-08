'use strict';

const { criarServidorReserva } = require('./app');
const { config } = require('./config/env');
const { SEED_PADRAO } = require('./config/seed');

const { server, repository } = criarServidorReserva(SEED_PADRAO);

server.listen(config.porta, config.host, () => {
  const hostExibicao = config.host === '0.0.0.0' ? 'localhost' : config.host;

  console.log(`UNISpace API iniciada em http://${hostExibicao}:${config.porta}`);
  console.log(`Ambiente: ${config.nodeEnv}`);
  console.log(`Espaços carregados: ${repository.espacos.size}`);
  console.log('Endpoints disponíveis: GET /health | POST /api/v1/reservas');
  console.log(
    'Exemplo de espaço para reserva: espaco-lab-01 | usuário: user-demo-1 / demo@aluno.ufop.edu.br'
  );
});

function encerrar(sinal) {
  console.log(`\nRecebido ${sinal}. Encerrando o servidor...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => encerrar('SIGINT'));
process.on('SIGTERM', () => encerrar('SIGTERM'));

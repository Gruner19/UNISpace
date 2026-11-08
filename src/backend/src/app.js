'use strict';

const http = require('node:http');
const { ReservaRepository } = require('./repositories/reservaRepository');
const { ReservaService } = require('./services/reservaService');
const { ReservaController } = require('./controllers/reservaController');

/**
 * Cria o servidor HTTP da API do UNISpace com o módulo de reservas configurado.
 */
function criarServidorReserva(dadosSeed = {}) {
  const repository = new ReservaRepository(dadosSeed);
  const service = new ReservaService(repository);
  const controller = new ReservaController(service);

  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && (req.url === '/health' || req.url === '/api/v1/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          sucesso: true,
          status: 'ok',
          servico: 'unispace-backend',
          espacosCarregados: repository.espacos.size,
          dataHora: new Date().toISOString()
        })
      );
      return;
    }

    if (req.method === 'POST' && req.url === '/api/v1/reservas') {
      let rawBody = '';
      req.on('data', (chunk) => {
        rawBody += chunk;
      });
      req.on('end', async () => {
        try {
          req.body = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(
            JSON.stringify({
              sucesso: false,
              erro: { codigo: 'JSON_INVALIDO', mensagem: 'Corpo JSON malformado.' }
            })
          );
          return;
        }
        await controller.criarReserva(req, res);
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ sucesso: false, erro: { codigo: 'ROTA_NAO_ENCONTRADA' } }));
  });

  return { server, repository, service, controller };
}

module.exports = { criarServidorReserva };

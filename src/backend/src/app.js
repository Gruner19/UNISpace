'use strict';

const http = require('node:http');
const { ReservaRepository } = require('./repositories/reservaRepository');
const { ReservaService } = require('./services/reservaService');
const { ReservaController } = require('./controllers/reservaController');
const { EspacoRepository } = require('./repositories/espacoRepository');
const { EspacoService } = require('./services/espacoService');
const { EspacoController } = require('./controllers/espacoController');

/**
 * Cria o servidor HTTP da API do UNISpace com os módulos de reservas e espaços configurados.
 */
function criarServidorReserva(dadosSeed = {}) {
  const reservaRepository = new ReservaRepository(dadosSeed);
  const reservaService = new ReservaService(reservaRepository);
  const reservaController = new ReservaController(reservaService);

  const espacoRepository = new EspacoRepository(dadosSeed);
  const espacoService = new EspacoService(espacoRepository);
  const espacoController = new EspacoController(espacoService);

  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && (req.url === '/health' || req.url === '/api/v1/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          sucesso: true,
          status: 'ok',
          servico: 'unispace-backend',
          espacosCarregados: reservaRepository.espacos.size,
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
        await reservaController.criarReserva(req, res);
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/v1/espacos') {
      espacoController.listarEspacos(req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ sucesso: false, erro: { codigo: 'ROTA_NAO_ENCONTRADA' } }));
  });

  return { server, reservaRepository, reservaService, reservaController, espacoRepository, espacoService, espacoController };
}

module.exports = { criarServidorReserva };

'use strict';

const http = require('node:http');
const { ReservaRepository } = require('./repositories/reservaRepository');
const { ReservaService } = require('./services/reservaService');
const { ReservaController } = require('./controllers/reservaController');
const { UsuarioRepository } = require('./repositories/usuarioRepository');
const { AuthService } = require('./services/authService');
const { AuthController } = require('./controllers/authController');
const { PrioridadeRepository } = require('./repositories/prioridadeRepository');
const { PrioridadeService } = require('./services/prioridadeService');
const { PrioridadeController } = require('./controllers/prioridadeController');
const { identificarUsuarioOpcional, autorizarPerfil } = require('./middlewares/authMiddleware');

/**
 * Lê o corpo JSON da requisição (compatível com o servidor HTTP nativo).
 * @param {object} req
 * @returns {Promise<object>}
 */
function lerCorpoJson(req) {
  return new Promise((resolve, reject) => {
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk;
    });
    req.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch {
        reject(new Error('JSON_INVALIDO'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Preenche req.usuario a partir dos cabeçalhos de desenvolvimento quando não há JWT.
 * Mantém o mesmo fluxo de fallback usado por criarReserva (x-usuario-id/email/perfil).
 * @param {object} req
 */
function popularUsuarioPorCabecalhosDev(req) {
  if (req.usuario) return;
  req.usuario = {
    id: req.headers['x-usuario-id'],
    email: req.headers['x-usuario-email'],
    perfil: req.headers['x-usuario-perfil'] || 'ESTUDANTE',
    ip: req.socket?.remoteAddress || '127.0.0.1'
  };
}

/**
 * Cria o servidor HTTP da API do UNISpace com os módulos de reservas e autenticação configurados.
 */
function criarServidorReserva(dadosSeed = {}, opcoesServidor = {}) {
  const repository = new ReservaRepository(dadosSeed);
  const prioridadeRepository = new PrioridadeRepository({
    cursos: dadosSeed.cursos || [],
    prioridadesRotativas: dadosSeed.prioridadesRotativas || []
  });
  const prioridadeService = new PrioridadeService(prioridadeRepository, repository);
  const prioridadeController = new PrioridadeController(prioridadeService);

  const service = new ReservaService(repository, prioridadeService);
  const controller = new ReservaController(service);

  const usuarioRepository = new UsuarioRepository(dadosSeed.usuarios || []);
  const authService = new AuthService(usuarioRepository);
  const authController = new AuthController(authService);
  const obterAgora = typeof opcoesServidor.obterAgora === 'function' ? opcoesServidor.obterAgora : null;

  const server = http.createServer((req, res) => {
    // Healthcheck
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

    // POST /api/v1/auth/login
    if (req.method === 'POST' && req.url === '/api/v1/auth/login') {
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
        await authController.login(req, res);
      });
      return;
    }

    // POST /api/v1/reservas
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

        // Tenta identificar o usuário via token JWT no cabeçalho Authorization
        identificarUsuarioOpcional(req);
        if (obterAgora) {
          req.body = { ...req.body, dataHoraReferencia: obterAgora() };
        }

        await controller.criarReserva(req, res);
      });
      return;
    }

    // P2.2: GET /api/v1/prioridades/atual?espacoId=...&semana=YYYY-MM-DD
    const urlObj = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && urlObj.pathname === '/api/v1/prioridades/atual') {
      req.query = {
        espacoId: urlObj.searchParams.get('espacoId') || undefined,
        semana: urlObj.searchParams.get('semana') || undefined
      };
      if (obterAgora) {
        req.dataHoraReferencia = obterAgora();
      }
      prioridadeController.consultarPrioridadeAtual(req, res);
      return;
    }

    // P2.2: POST /api/v1/prioridades/calcular (apenas administrador)
    if (req.method === 'POST' && urlObj.pathname === '/api/v1/prioridades/calcular') {
      (async () => {
        let corpo;
        try {
          corpo = await lerCorpoJson(req);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(
            JSON.stringify({
              sucesso: false,
              mensagem: 'Corpo JSON malformado.',
              erro: { codigo: 'JSON_INVALIDO', mensagem: 'Corpo JSON malformado.' }
            })
          );
          return;
        }
        req.body = corpo;
        if (obterAgora) {
          req.dataHoraReferencia = obterAgora();
        }
        identificarUsuarioOpcional(req);
        popularUsuarioPorCabecalhosDev(req);

        if (!autorizarPerfil('ADMINISTRADOR')(req, res)) return;

        await prioridadeController.calcularPrioridadeSemanal(req, res);
      })();
      return;
    }

    // T9.1: POST /api/v1/reservas/:reservaId/aprovar  |  POST /api/v1/reservas/:reservaId/rejeitar  (apenas administrador)
    const mAprovacao = req.url.match(/^\/api\/v1\/reservas\/([^\/]+)\/(aprovar|rejeitar)$/);
    if (req.method === 'POST' && mAprovacao) {
      (async () => {
        let corpo;
        try {
          corpo = await lerCorpoJson(req);
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
        req.body = corpo;
        req.params = { reservaId: mAprovacao[1] };

        identificarUsuarioOpcional(req);
        popularUsuarioPorCabecalhosDev(req);

        if (!autorizarPerfil('ADMINISTRADOR')(req, res)) return;

        try {
          if (mAprovacao[2] === 'aprovar') {
            await controller.aprovarReserva(req, res);
          } else {
            await controller.rejeitarReserva(req, res);
          }
        } catch (erro) {
          const corpoErro = JSON.stringify({
            sucesso: false,
            erro: {
              codigo: 'ERRO_INTERNO_SERVIDOR',
              mensagem: 'Ocorreu um erro interno ao processar a solicitação.'
            }
          });
          res.writeHead(500, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(corpoErro)
          });
          res.end(corpoErro);
        }
      })();
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ sucesso: false, erro: { codigo: 'ROTA_NAO_ENCONTRADA' } }));
  });

  return {
    server,
    repository,
    service,
    controller,
    usuarioRepository,
    authService,
    authController,
    prioridadeRepository,
    prioridadeService,
    prioridadeController
  };
}

module.exports = { criarServidorReserva };

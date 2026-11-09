'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { criarServidorReserva } = require('../src/app');
const { SEED_PADRAO } = require('../src/config/seed');

function criarSeedTeste() {
  return JSON.parse(JSON.stringify(SEED_PADRAO));
}

async function iniciarServidorTeste(seed) {
  const { server } = criarServidorReserva(seed);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const porta = server.address().port;
  return {
    server,
    porta,
    fechar: () => new Promise((resolve) => server.close(resolve))
  };
}

async function enviarRequisicao(porta, metodo, caminho, body = null, headers = {}) {
  const url = `http://127.0.0.1:${porta}${caminho}`;
  const opcoes = {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body) {
    opcoes.body = JSON.stringify(body);
  }
  const resposta = await fetch(url, opcoes);
  const dados = await resposta.json();
  return { status: resposta.status, dados };
}

test('P1.1 Integração — POST /api/v1/auth/login com credenciais válidas retorna 200 e token', async () => {
  const seed = criarSeedTeste();
  const { porta, fechar } = await iniciarServidorTeste(seed);

  try {
    const res = await enviarRequisicao(porta, 'POST', '/api/v1/auth/login', {
      email: 'demo@aluno.ufop.edu.br',
      senha: 'SenhaSegura123!'
    });

    assert.equal(res.status, 200);
    assert.equal(res.dados.sucesso, true);
    assert.ok(res.dados.dados.token, 'Deve retornar o token JWT');
    assert.equal(res.dados.dados.usuario.email, 'demo@aluno.ufop.edu.br');
    assert.equal(res.dados.dados.usuario.perfil, 'ESTUDANTE');
  } finally {
    await fechar();
  }
});

test('P1.1 Integração — POST /api/v1/auth/login rejeita senha incorreta com 401', async () => {
  const seed = criarSeedTeste();
  const { porta, fechar } = await iniciarServidorTeste(seed);

  try {
    const res = await enviarRequisicao(porta, 'POST', '/api/v1/auth/login', {
      email: 'demo@aluno.ufop.edu.br',
      senha: 'SenhaIncorretaErrada'
    });

    assert.equal(res.status, 401);
    assert.equal(res.dados.sucesso, false);
    assert.equal(res.dados.erro.codigo, 'CREDENCIAS_INVALIDAS');
  } finally {
    await fechar();
  }
});

test('P1.1 Integração — POST /api/v1/auth/login rejeita e-mail não institucional (RN-02) com 403', async () => {
  const seed = criarSeedTeste();
  const { porta, fechar } = await iniciarServidorTeste(seed);

  try {
    const res = await enviarRequisicao(porta, 'POST', '/api/v1/auth/login', {
      email: 'usuario@gmail.com',
      senha: 'QualquerSenha123'
    });

    assert.equal(res.status, 403);
    assert.equal(res.dados.sucesso, false);
    assert.equal(res.dados.erro.codigo, 'EMAIL_NAO_INSTITUCIONAL');
  } finally {
    await fechar();
  }
});

test('P1.1 Integração — fluxo completo: login obtém JWT e utiliza na criação de reserva', async () => {
  const seed = criarSeedTeste();
  const { porta, fechar } = await iniciarServidorTeste(seed);

  try {
    // 1. Faz o login
    const resLogin = await enviarRequisicao(porta, 'POST', '/api/v1/auth/login', {
      email: 'demo@aluno.ufop.edu.br',
      senha: 'SenhaSegura123!'
    });
    assert.equal(resLogin.status, 200);
    const token = resLogin.dados.dados.token;

    // 2. Faz uma reserva passando o token no cabeçalho Authorization: Bearer <token>
    const resReserva = await enviarRequisicao(
      porta,
      'POST',
      '/api/v1/reservas',
      {
        espacoId: 'espaco-lab-01',
        data: '2026-11-20',
        horarioInicio: '10:00',
        horarioFim: '11:30',
        numeroParticipantes: 10,
        finalidade: 'Reunião do time de Engenharia de Software'
      },
      {
        Authorization: `Bearer ${token}`
      }
    );

    assert.equal(resReserva.status, 201);
    assert.equal(resReserva.dados.sucesso, true);
    assert.equal(resReserva.dados.dados.usuarioId, 'user-demo-1');
    assert.equal(resReserva.dados.dados.status, 'CONFIRMADA');
  } finally {
    await fechar();
  }
});

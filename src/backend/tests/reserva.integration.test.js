'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { criarServidorReserva } = require('../src/app');

function criarSeedPadrao() {
  return {
    espacos: [
      {
        id: 'espaco-lab-01',
        codigo: 'LAB-204',
        nome: 'Laboratório de Engenharia de Software',
        tipo: 'LABORATORIO',
        capacidade: 30,
        localizacao: 'ICEB III - Sala 204',
        ativo: true
      },
      {
        id: 'espaco-inativo-02',
        codigo: 'SALA-OFF',
        nome: 'Sala em Reforma',
        tipo: 'SALA_ESTUDO',
        capacidade: 10,
        localizacao: 'Biblioteca',
        ativo: false
      }
    ],
    usuarios: [
      {
        id: 'user-est-1',
        nome: 'Jordan Correa',
        emailInstitucional: 'jordan@aluno.ufop.edu.br',
        perfil: 'ESTUDANTE'
      },
      {
        id: 'user-est-2',
        nome: 'César Paredes',
        emailInstitucional: 'cesar@aluno.ufop.edu.br',
        perfil: 'ESTUDANTE'
      }
    ],
    bloqueios: [
      {
        id: 'bloq-01',
        espacoId: 'espaco-lab-01',
        dataInicio: '2026-11-20',
        dataFim: '2026-11-20',
        horarioInicio: '08:00',
        horarioFim: '10:00',
        motivo: 'Manutenção preventiva de rede',
        status: 'ATIVO'
      }
    ]
  };
}

async function enviarPostReserva(porta, body, headers = {}) {
  const resposta = await fetch(`http://127.0.0.1:${porta}/api/v1/reservas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-usuario-id': 'user-est-1',
      'x-usuario-email': 'jordan@aluno.ufop.edu.br',
      ...headers
    },
    body: JSON.stringify(body)
  });
  const json = await resposta.json();
  return { status: resposta.status, json };
}

test('T6.2 Integração — Deve criar reserva válida (201) e gravar trilha de auditoria (RN-13)', async () => {
  const { server, repository } = criarServidorReserva(criarSeedPadrao());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const { status, json } = await enviarPostReserva(port, {
      espacoId: 'espaco-lab-01',
      data: '2026-11-18',
      horarioInicio: '14:00',
      horarioFim: '16:00',
      numeroParticipantes: 15,
      finalidade: 'Desenvolvimento do sprint 4 de ESII'
    });

    assert.equal(status, 201);
    assert.equal(json.sucesso, true);
    assert.equal(json.dados.status, 'CONFIRMADA');
    assert.ok(json.dados.codigoConfirmacao.startsWith('RES-'));
    assert.equal(repository.auditoria.length, 1);
    assert.equal(repository.auditoria[0].acao, 'CRIACAO_RESERVA');
  } finally {
    server.close();
  }
});

test('T6.2 Integração — RN-01 e RN-10: Duas solicitações simultâneas para o mesmo horário confirmam apenas a primeira', async () => {
  const { server, repository } = criarServidorReserva(criarSeedPadrao());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const payload = {
      espacoId: 'espaco-lab-01',
      data: '2026-11-19',
      horarioInicio: '10:00',
      horarioFim: '12:00',
      numeroParticipantes: 12,
      finalidade: 'Reunião concorrente de projeto'
    };

    const [resp1, resp2] = await Promise.all([
      enviarPostReserva(port, payload, {
        'x-usuario-id': 'user-est-1',
        'x-usuario-email': 'jordan@aluno.ufop.edu.br'
      }),
      enviarPostReserva(port, payload, {
        'x-usuario-id': 'user-est-2',
        'x-usuario-email': 'cesar@aluno.ufop.edu.br'
      })
    ]);

    const codigosStatus = [resp1.status, resp2.status].sort();
    assert.deepEqual(codigosStatus, [201, 409]);
    assert.equal(repository.reservas.size, 1);
  } finally {
    server.close();
  }
});

test('T6.2 Integração — Deve rejeitar e-mail não institucional (RN-02), excesso de capacidade (RN-09) e bloqueio ativo (RN-06)', async () => {
  const { server } = criarServidorReserva(criarSeedPadrao());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    // 1. E-mail não institucional -> 403
    const respEmail = await enviarPostReserva(
      port,
      {
        espacoId: 'espaco-lab-01',
        data: '2026-11-20',
        horarioInicio: '14:00',
        horarioFim: '16:00',
        numeroParticipantes: 10,
        finalidade: 'Tentativa com email externo'
      },
      { 'x-usuario-email': 'externo@hotmail.com' }
    );
    assert.equal(respEmail.status, 403);
    assert.equal(respEmail.json.erro.codigo, 'EMAIL_NAO_INSTITUCIONAL');

    // 2. Excesso de capacidade (35 > 30) -> 422
    const respCapacidade = await enviarPostReserva(port, {
      espacoId: 'espaco-lab-01',
      data: '2026-11-20',
      horarioInicio: '14:00',
      horarioFim: '16:00',
      numeroParticipantes: 35,
      finalidade: 'Turma acima da lotação máxima'
    });
    assert.equal(respCapacidade.status, 422);
    assert.equal(respCapacidade.json.erro.codigo, 'CAPACIDADE_EXCEDIDA');

    // 3. Conflito com bloqueio administrativo (08:00-10:00 em 2026-11-20) -> 409
    const respBloqueio = await enviarPostReserva(port, {
      espacoId: 'espaco-lab-01',
      data: '2026-11-20',
      horarioInicio: '08:30',
      horarioFim: '09:30',
      numeroParticipantes: 10,
      finalidade: 'Horário interditado por manutenção'
    });
    assert.equal(respBloqueio.status, 409);
    assert.equal(respBloqueio.json.erro.codigo, 'ESPACO_BLOQUEADO_ADMIN');
  } finally {
    server.close();
  }
});

test('T6.2 Integração — Transação Atômica: Se a gravação de auditoria falhar, realiza ROLLBACK integral', async () => {
  const { server, repository } = criarServidorReserva(criarSeedPadrao());
  repository._falharNaAuditoriaParaTeste = true;
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const { status } = await enviarPostReserva(port, {
      espacoId: 'espaco-lab-01',
      data: '2026-11-21',
      horarioInicio: '14:00',
      horarioFim: '16:00',
      numeroParticipantes: 10,
      finalidade: 'Teste de rollback transacional'
    });

    assert.equal(status, 500);
    // Verifica que NENHUMA reserva permaneceu gravada após a falha na auditoria
    assert.equal(repository.reservas.size, 0);
    assert.equal(repository.auditoria.length, 0);
  } finally {
    server.close();
  }
});

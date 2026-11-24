'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { criarServidorReserva } = require('../src/app');
const { gerarHashSenha } = require('../src/utils/senhaUtil');

function criarSeedCancelamento() {
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
      }
    ],
    usuarios: [
      {
        id: 'user-est-1',
        nome: 'Jordan Correa',
        emailInstitucional: 'jordan@aluno.ufop.edu.br',
        senhaHash: gerarHashSenha('Senha123!'),
        perfil: 'ESTUDANTE',
        ativo: true
      },
      {
        id: 'user-est-2',
        nome: 'César Paredes',
        emailInstitucional: 'cesar@aluno.ufop.edu.br',
        senhaHash: gerarHashSenha('Senha123!'),
        perfil: 'ESTUDANTE',
        ativo: true
      },
      {
        id: 'user-admin-1',
        nome: 'Admin UNISpace',
        emailInstitucional: 'admin@ufop.edu.br',
        senhaHash: gerarHashSenha('Admin123!'),
        perfil: 'ADMINISTRADOR',
        ativo: true
      }
    ],
    reservas: [
      {
        id: 'res-confirmada-01',
        codigoConfirmacao: 'RES-AAA111',
        espacoId: 'espaco-lab-01',
        usuarioId: 'user-est-1',
        data: '2026-11-26',
        horarioInicio: '14:00',
        horarioFim: '16:00',
        duracaoMinutos: 120,
        numeroParticipantes: 10,
        finalidade: 'Estudo para entrega final de ESII',
        status: 'CONFIRMADA',
        contabilizaCota: true,
        criadoEm: '2026-11-24T10:00:00.000Z'
      },
      {
        id: 'res-ja-cancelada-02',
        codigoConfirmacao: 'RES-BBB222',
        espacoId: 'espaco-lab-01',
        usuarioId: 'user-est-1',
        data: '2026-11-27',
        horarioInicio: '10:00',
        horarioFim: '12:00',
        duracaoMinutos: 120,
        numeroParticipantes: 8,
        finalidade: 'Reunião cancelada anteriormente',
        status: 'CANCELADA_USUARIO',
        contabilizaCota: false,
        criadoEm: '2026-11-24T10:00:00.000Z'
      }
    ],
    bloqueios: []
  };
}

test('T7.1 Integração — Dono cancela via DELETE com >= 2h: devolve cota, registra auditoria e libera horário imediatamente', async () => {
  const { server, repository } = criarServidorReserva(criarSeedCancelamento(), {
    obterAgora: () => new Date('2026-11-26T10:00:00Z') // 4h antes
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const resp = await fetch(`http://127.0.0.1:${port}/api/v1/reservas/res-confirmada-01`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-usuario-id': 'user-est-1',
        'x-usuario-email': 'jordan@aluno.ufop.edu.br',
        'x-usuario-perfil': 'ESTUDANTE'
      },
      body: JSON.stringify({ motivo: 'Mudança de horário do grupo' })
    });
    const json = await resp.json();

    assert.equal(resp.status, 200);
    assert.equal(json.sucesso, true);
    assert.equal(json.reservaId, 'res-confirmada-01');
    assert.equal(json.dados.status, 'CANCELADA_USUARIO');
    assert.equal(json.dados.contabilizaCota, false);
    assert.equal(json.meta.horarioLiberado, true);
    assert.equal(json.meta.dentroDoPrazoSemPenalidade, true);

    // Verifica auditoria (RN-13)
    assert.equal(repository.auditoria.length, 1);
    assert.equal(repository.auditoria[0].acao, 'CANCELAMENTO_RESERVA');
    assert.equal(repository.auditoria[0].statusAnterior, 'CONFIRMADA');
    assert.equal(repository.auditoria[0].statusNovo, 'CANCELADA_USUARIO');

    // Verifica que o horário liberado pode ser reservado imediatamente por outro usuário
    const respNova = await fetch(`http://127.0.0.1:${port}/api/v1/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-usuario-id': 'user-est-2',
        'x-usuario-email': 'cesar@aluno.ufop.edu.br'
      },
      body: JSON.stringify({
        espacoId: 'espaco-lab-01',
        data: '2026-11-26',
        horarioInicio: '14:00',
        horarioFim: '16:00',
        numeroParticipantes: 12,
        finalidade: 'Reaproveitamento do horário liberado'
      })
    });
    assert.equal(respNova.status, 201);
  } finally {
    server.close();
  }
});

test('T7.1 Integração — Dono cancela via PUT com < 2h: libera horário, mas mantém horas contabilizadas na cota (RN-05)', async () => {
  const { server } = criarServidorReserva(criarSeedCancelamento(), {
    obterAgora: () => new Date('2026-11-26T13:00:00Z') // 1h antes (< 2h)
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const resp = await fetch(`http://127.0.0.1:${port}/api/v1/reservas/res-confirmada-01/cancelar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-usuario-id': 'user-est-1',
        'x-usuario-email': 'jordan@aluno.ufop.edu.br',
        'x-usuario-perfil': 'ESTUDANTE'
      },
      body: JSON.stringify({ motivo: 'Imprevisto de última hora' })
    });
    const json = await resp.json();

    assert.equal(resp.status, 200);
    assert.equal(json.dados.status, 'CANCELADA_USUARIO');
    assert.equal(json.dados.contabilizaCota, true);
    assert.equal(json.meta.dentroDoPrazoSemPenalidade, false);
    assert.equal(json.meta.horarioLiberado, true);
  } finally {
    server.close();
  }
});

test('T7.1 Integração — Administrador autenticado via JWT cancela reserva de terceiro (RN-11) e envia notificação', async () => {
  const { server, repository } = criarServidorReserva(criarSeedCancelamento(), {
    obterAgora: () => new Date('2026-11-26T10:00:00Z')
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    // Login do admin via P1.1 para obter JWT real
    const loginResp = await fetch(`http://127.0.0.1:${port}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ufop.edu.br', senha: 'Admin123!' })
    });
    const loginJson = await loginResp.json();
    assert.equal(loginResp.status, 200);
    const tokenAdmin = loginJson.dados.token;

    const resp = await fetch(`http://127.0.0.1:${port}/api/v1/reservas/res-confirmada-01`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ motivo: 'Ajuste administrativo de agenda' })
    });
    const json = await resp.json();

    assert.equal(resp.status, 200);
    assert.equal(json.dados.status, 'CANCELADA_ADMIN');
    assert.equal(json.dados.contabilizaCota, false);
    assert.equal(repository.notificacoes.length, 1);
    assert.equal(repository.notificacoes[0].usuarioId, 'user-est-1');
    assert.equal(repository.notificacoes[0].tipo, 'RESERVA_CANCELADA_ADMIN');
  } finally {
    server.close();
  }
});

test('T7.1 Integração — RN-11: Estudante que não é dono da reserva recebe 403', async () => {
  const { server, repository } = criarServidorReserva(criarSeedCancelamento(), {
    obterAgora: () => new Date('2026-11-26T10:00:00Z')
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const resp = await fetch(`http://127.0.0.1:${port}/api/v1/reservas/res-confirmada-01`, {
      method: 'DELETE',
      headers: {
        'x-usuario-id': 'user-est-2',
        'x-usuario-email': 'cesar@aluno.ufop.edu.br',
        'x-usuario-perfil': 'ESTUDANTE'
      }
    });
    const json = await resp.json();

    assert.equal(resp.status, 403);
    assert.equal(json.erro.codigo, 'PERMISSAO_CANCELAMENTO_NEGADA');
    assert.ok(json.mensagem); // Compatibilidade com reservationService.js (T7.2)
    assert.equal(repository.buscarReservaPorId('res-confirmada-01').status, 'CONFIRMADA');
  } finally {
    server.close();
  }
});

test('T7.1 Integração — Valida 401 sem autenticação, 404 inexistente, 409 já cancelada e 422 após início', async () => {
  const { server } = criarServidorReserva(criarSeedCancelamento(), {
    obterAgora: () => new Date('2026-11-26T14:30:00Z') // após o início da res-confirmada-01 (14:00)
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    // 401 sem autenticação
    const resp401 = await fetch(`http://127.0.0.1:${port}/api/v1/reservas/res-confirmada-01`, {
      method: 'DELETE'
    });
    assert.equal(resp401.status, 401);

    // 404 reserva inexistente
    const resp404 = await fetch(`http://127.0.0.1:${port}/api/v1/reservas/res-nao-existe`, {
      method: 'DELETE',
      headers: { 'x-usuario-id': 'user-est-1', 'x-usuario-email': 'jordan@aluno.ufop.edu.br' }
    });
    assert.equal(resp404.status, 404);

    // 409 reserva já cancelada
    const resp409 = await fetch(`http://127.0.0.1:${port}/api/v1/reservas/res-ja-cancelada-02`, {
      method: 'DELETE',
      headers: { 'x-usuario-id': 'user-est-1', 'x-usuario-email': 'jordan@aluno.ufop.edu.br' }
    });
    assert.equal(resp409.status, 409);

    // 422 reserva já iniciada (RN-05)
    const resp422 = await fetch(`http://127.0.0.1:${port}/api/v1/reservas/res-confirmada-01`, {
      method: 'DELETE',
      headers: { 'x-usuario-id': 'user-est-1', 'x-usuario-email': 'jordan@aluno.ufop.edu.br' }
    });
    const json422 = await resp422.json();
    assert.equal(resp422.status, 422);
    assert.equal(json422.erro.codigo, 'PRAZO_CANCELAMENTO_EXPIRADO');
  } finally {
    server.close();
  }
});

test('T7.1 Integração — Transação Atômica: Falha na auditoria realiza ROLLBACK e preserva status CONFIRMADA', async () => {
  const { server, repository } = criarServidorReserva(criarSeedCancelamento(), {
    obterAgora: () => new Date('2026-11-26T10:00:00Z')
  });
  repository._falharNaAuditoriaParaTeste = true;
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const resp = await fetch(`http://127.0.0.1:${port}/api/v1/reservas/res-confirmada-01`, {
      method: 'DELETE',
      headers: {
        'x-usuario-id': 'user-est-1',
        'x-usuario-email': 'jordan@aluno.ufop.edu.br',
        'x-usuario-perfil': 'ESTUDANTE'
      }
    });

    assert.equal(resp.status, 500);
    assert.equal(repository.buscarReservaPorId('res-confirmada-01').status, 'CONFIRMADA');
    assert.equal(repository.auditoria.length, 0);
  } finally {
    server.close();
  }
});

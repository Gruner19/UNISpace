'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { criarServidorReserva } = require('../src/app');

function seedAprovacao(opts = {}) {
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
        id: 'espaco-sala-01',
        codigo: 'SALA-101',
        nome: 'Sala de Estudo da Biblioteca',
        tipo: 'SALA_ESTUDO',
        capacidade: 12,
        localizacao: 'Biblioteca Central - Sala 101',
        ativo: true
      }
    ],
    usuarios: [
      {
        id: 'user-est-1',
        nome: 'Estudante Solicitante',
        emailInstitucional: 'estudante@aluno.ufop.edu.br',
        perfil: 'ESTUDANTE',
        ativo: true
      },
      {
        id: 'user-admin-1',
        nome: 'Administrador UNISpace',
        emailInstitucional: 'admin@ufop.edu.br',
        perfil: 'ADMINISTRADOR',
        ativo: true
      },
      {
        id: 'user-est-2',
        nome: 'Outro Estudante',
        emailInstitucional: 'estudante2@aluno.ufop.edu.br',
        perfil: 'ESTUDANTE',
        ativo: true
      }
    ],
    reservas: [
      {
        id: 'res-pendente-01',
        codigoConfirmacao: 'RES-PEN01',
        espacoId: 'espaco-lab-01',
        usuarioId: 'user-est-1',
        data: '2026-12-05',
        horarioInicio: '14:00',
        horarioFim: '16:00',
        duracaoMinutos: 120,
        numeroParticipantes: 10,
        finalidade: 'Pesquisa de grupo de extensão',
        status: 'PENDENTE_APROVACAO',
        contabilizaCota: false,
        criadoEm: '2026-11-20T10:00:00Z'
      },
      {
        id: 'res-pendente-cota',
        codigoConfirmacao: 'RES-PEN02',
        espacoId: 'espaco-sala-01',
        usuarioId: 'user-est-1',
        data: '2026-12-05',
        horarioInicio: '10:00',
        horarioFim: '11:00',
        duracaoMinutos: 60,
        numeroParticipantes: 5,
        finalidade: 'Reserva que deve exceder cota ao ser aprovada',
        status: 'PENDENTE_APROVACAO',
        contabilizaCota: false,
        criadoEm: '2026-11-20T10:00:00Z'
      },
      {
        id: 'res-confirmada-01',
        codigoConfirmacao: 'RES-CON01',
        espacoId: 'espaco-lab-01',
        usuarioId: 'user-est-2',
        data: '2026-12-06',
        horarioInicio: '15:00',
        horarioFim: '17:00',
        duracaoMinutos: 120,
        numeroParticipantes: 8,
        finalidade: 'Reserva já confirmada que conflita com a pendente',
        status: 'CONFIRMADA',
        contabilizaCota: true,
        criadoEm: '2026-11-20T09:00:00Z'
      },
      {
        id: 'res-cota-a',
        codigoConfirmacao: 'RES-COTA-A',
        espacoId: 'espaco-sala-01',
        usuarioId: opts.cotaEst1 ? 'user-est-1' : 'user-est-2',
        data: '2026-12-02',
        horarioInicio: '08:00',
        horarioFim: '11:00',
        duracaoMinutos: 180,
        numeroParticipantes: 5,
        finalidade: 'Uso de cota A',
        status: 'CONFIRMADA',
        contabilizaCota: true,
        criadoEm: '2026-11-20T08:00:00Z'
      },
      {
        id: 'res-cota-b',
        codigoConfirmacao: 'RES-COTA-B',
        espacoId: 'espaco-sala-01',
        usuarioId: opts.cotaEst1 ? 'user-est-1' : 'user-est-2',
        data: '2026-12-03',
        horarioInicio: '08:00',
        horarioFim: '11:00',
        duracaoMinutos: 180,
        numeroParticipantes: 5,
        finalidade: 'Uso de cota B',
        status: 'CONFIRMADA',
        contabilizaCota: true,
        criadoEm: '2026-11-20T08:00:00Z'
      }
    ],
    bloqueios: []
  };
}

async function enviar(porta, metodo, caminho, corpo, headers = {}) {
  const resposta = await fetch(`http://127.0.0.1:${porta}${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: corpo === undefined ? undefined : JSON.stringify(corpo)
  });
  const texto = await resposta.text();
  const json = texto ? JSON.parse(texto) : {};
  return { status: resposta.status, json };
}

function cabecalhosAdmin(extra = {}) {
  return {
    'x-usuario-id': 'user-admin-1',
    'x-usuario-email': 'admin@ufop.edu.br',
    'x-usuario-perfil': 'ADMINISTRADOR',
    ...extra
  };
}

function cabecalhosEstudante(extra = {}) {
  return {
    'x-usuario-id': 'user-est-1',
    'x-usuario-email': 'estudante@aluno.ufop.edu.br',
    'x-usuario-perfil': 'ESTUDANTE',
    ...extra
  };
}

test('T9.1 Integração — Admin aprova reserva pendente (200): status CONFIRMADA, auditoria e notificação ao solicitante', async () => {
  const { server, repository } = criarServidorReserva(seedAprovacao());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const resposta = await enviar(port, 'POST', '/api/v1/reservas/res-pendente-01/aprovar', undefined, cabecalhosAdmin());

    assert.equal(resposta.status, 200);
    assert.equal(resposta.json.sucesso, true);
    assert.equal(resposta.json.dados.status, 'CONFIRMADA');
    assert.equal(resposta.json.dados.id, 'res-pendente-01');

    const aprovacao = repository.auditoria.find((a) => a.acao === 'APROVACAO_RESERVA');
    assert.ok(aprovacao, 'Esperado registro de auditoria APROVACAO_RESERVA');
    assert.equal(aprovacao.statusAnterior, 'PENDENTE_APROVACAO');
    assert.equal(aprovacao.statusNovo, 'CONFIRMADA');
    assert.equal(aprovacao.usuarioId, 'user-admin-1');

    const notificacao = repository.notificacoes.find(
      (n) => n.tipo === 'RESERVA_APROVADA' && n.usuarioId === 'user-est-1'
    );
    assert.ok(notificacao, 'Esperado notificação RESERVA_APROVADA ao solicitante');
    assert.equal(notificacao.assunto, 'Sua reserva especial foi aprovada');
  } finally {
    server.close();
  }
});

test('T9.1 Integração — Admin rejeita reserva pendente com motivo (200): status CANCELADA_ADMIN, auditoria e notificação', async () => {
  const { server, repository } = criarServidorReserva(seedAprovacao());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const resposta = await enviar(
      port,
      'POST',
      '/api/v1/reservas/res-pendente-01/rejeitar',
      { motivo: 'Justificativa insuficiente para grupo de pesquisa' },
      cabecalhosAdmin()
    );

    assert.equal(resposta.status, 200);
    assert.equal(resposta.json.sucesso, true);
    assert.equal(resposta.json.dados.status, 'CANCELADA_ADMIN');
    assert.equal(resposta.json.dados.motivoCancelamento, 'Justificativa insuficiente para grupo de pesquisa');

    const rejeicao = repository.auditoria.find((a) => a.acao === 'REJEICAO_RESERVA');
    assert.ok(rejeicao, 'Esperado registro de auditoria REJEICAO_RESERVA');
    assert.equal(rejeicao.statusAnterior, 'PENDENTE_APROVACAO');
    assert.equal(rejeicao.statusNovo, 'CANCELADA_ADMIN');
    assert.equal(rejeicao.detalhes.motivoRejeicao, 'Justificativa insuficiente para grupo de pesquisa');

    const notificacao = repository.notificacoes.find((n) => n.tipo === 'RESERVA_REJEITADA');
    assert.ok(notificacao, 'Esperado notificação RESERVA_REJEITADA ao solicitante');
    assert.ok(notificacao.corpo.includes('Justificativa insuficiente para grupo de pesquisa'));
  } finally {
    server.close();
  }
});

test('T9.1 Integração — Aprovar reserva inexistente retorna 404', async () => {
  const { server } = criarServidorReserva(seedAprovacao());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const resposta = await enviar(port, 'POST', '/api/v1/reservas/res-nao-existe/aprovar', undefined, cabecalhosAdmin());
    assert.equal(resposta.status, 404);
    assert.equal(resposta.json.erro.codigo, 'RESERVA_NAO_ENCONTRADA');
  } finally {
    server.close();
  }
});

test('T9.1 Integração — Aprovar reserva já confirmada retorna 409', async () => {
  const { server } = criarServidorReserva(seedAprovacao());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const resposta = await enviar(port, 'POST', '/api/v1/reservas/res-confirmada-01/aprovar', undefined, cabecalhosAdmin());
    assert.equal(resposta.status, 409);
    assert.equal(resposta.json.erro.codigo, 'RESERVA_JA_PROCESSADA');
  } finally {
    server.close();
  }
});

test('T9.1 Integração — Aprovação bloqueada por conflito com reserva confirmada retorna 409 e não altera o status', async () => {
  // Mesmo seed do happy path, mas a reserva confirmada passa para o mesmo dia/horário sobreposto
  const seedConflito = seedAprovacao();
  seedConflito.reservas.find((r) => r.id === 'res-confirmada-01').data = '2026-12-05';
  const { server, repository } = criarServidorReserva(seedConflito);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    // res-pendente-01 é 14:00-16:00 no lab; res-confirmada-01 é 15:00-17:00 no mesmo lab/dia
    const resposta = await enviar(port, 'POST', '/api/v1/reservas/res-pendente-01/aprovar', undefined, cabecalhosAdmin());
    assert.equal(resposta.status, 409);
    assert.equal(resposta.json.erro.codigo, 'CONFLITO_APROVACAO_RESERVA');

    // Rollback transacional: status deve permanecer pendente
    assert.equal(repository.reservas.get('res-pendente-01').status, 'PENDENTE_APROVACAO');
  } finally {
    server.close();
  }
});

test('T9.1 Integração — Aprovação bloqueada por limite de reservas ativas (RN-03) retorna 422', async () => {
  const { server } = criarServidorReserva(seedAprovacao({ cotaEst1: true }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    // user-est-1 já tem 2 reservas confirmadas (res-cota-a, res-cota-b) = o limite de
    // reservas ativas simultâneas (RN-03). Como 2 reservas x 3h = 6h já esgotam a cota
    // semanal, a checagem de horas só é alcançada se o limite de quantidade for flexibilizado.
    const resposta = await enviar(port, 'POST', '/api/v1/reservas/res-pendente-cota/aprovar', undefined, cabecalhosAdmin());
    assert.equal(resposta.status, 422);
    assert.equal(resposta.json.erro.codigo, 'LIMITE_RESERVAS_ATIVAS_EXCEDIDO');
  } finally {
    server.close();
  }
});

test('T9.1 Integração — Estudante não pode aprovar reservas (403)', async () => {
  const { server } = criarServidorReserva(seedAprovacao());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const resposta = await enviar(port, 'POST', '/api/v1/reservas/res-pendente-01/aprovar', undefined, cabecalhosEstudante());
    assert.equal(resposta.status, 403);
    assert.equal(resposta.json.erro.codigo, 'PERFIL_NAO_AUTORIZADO');
  } finally {
    server.close();
  }
});

test('T9.1 Integração — Sem cabeçalhos de desenvolvimento vira ESTUDANTE e não pode aprovar (403)', async () => {
  const { server } = criarServidorReserva(seedAprovacao());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    // Sem cabeçalhos x-usuario-*: o fallback de dev define perfil ESTUDANTE, então o
    // middleware de perfil rejeita antes mesmo de o serviço validar a autenticação.
    const resposta = await enviar(port, 'POST', '/api/v1/reservas/res-pendente-01/aprovar', undefined);
    assert.equal(resposta.status, 403);
    assert.equal(resposta.json.erro.codigo, 'PERFIL_NAO_AUTORIZADO');
  } finally {
    server.close();
  }
});

test('T9.1 Integração — Rejeitar reserva já processada retorna 409', async () => {
  const { server } = criarServidorReserva(seedAprovacao());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const resposta = await enviar(
      port,
      'POST',
      '/api/v1/reservas/res-confirmada-01/rejeitar',
      { motivo: 'teste' },
      cabecalhosAdmin()
    );
    assert.equal(resposta.status, 409);
    assert.equal(resposta.json.erro.codigo, 'RESERVA_JA_PROCESSADA');
  } finally {
    server.close();
  }
});
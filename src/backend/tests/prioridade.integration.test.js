'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { criarServidorReserva } = require('../src/app');

function criarSeedPrioridade() {
  return {
    cursos: [
      { id: 'curso-bcc', codigo: 'BCC', nome: 'Ciência da Computação', faculdade: 'ICEB' },
      { id: 'curso-ec', codigo: 'ENG-COMP', nome: 'Engenharia de Computação', faculdade: 'ICEA' }
    ],
    espacos: [
      {
        id: 'espaco-lab-01',
        codigo: 'LAB-204',
        nome: 'Laboratório de Software',
        tipo: 'LABORATORIO',
        capacidade: 30,
        localizacao: 'ICEB III',
        horarioNobreInicio: '18:00',
        horarioNobreFim: '22:00',
        ativo: true
      }
    ],
    usuarios: [
      {
        id: 'user-bcc',
        nome: 'Estudante BCC',
        emailInstitucional: 'bcc@aluno.ufop.edu.br',
        perfil: 'ESTUDANTE',
        cursoId: 'curso-bcc'
      },
      {
        id: 'user-ec',
        nome: 'Estudante EC',
        emailInstitucional: 'ec@aluno.ufop.edu.br',
        perfil: 'ESTUDANTE',
        cursoId: 'curso-ec'
      },
      {
        id: 'user-admin',
        nome: 'Administrador',
        emailInstitucional: 'admin@ufop.edu.br',
        perfil: 'ADMINISTRADOR'
      }
    ],
    // Na semana anterior (16/11 a 22/11), BCC usou 3h e EC usou 0h -> EC ganha prioridade na semana 23/11!
    reservas: [
      {
        id: 'res-hist-bcc',
        codigoConfirmacao: 'RES-HIST01',
        espacoId: 'espaco-lab-01',
        usuarioId: 'user-bcc',
        cursoId: 'curso-bcc',
        data: '2026-11-18',
        horarioInicio: '14:00',
        horarioFim: '17:00',
        duracaoMinutos: 180,
        numeroParticipantes: 10,
        finalidade: 'Aula prática semana anterior',
        status: 'CONCLUIDA',
        contabilizaCota: false
      }
    ],
    bloqueios: []
  };
}

test('P2.2 Integração — GET /api/v1/prioridades/atual consulta grupo prioritário e aplica RN-04 na criação de reserva (janela 24h)', async () => {
  const { server } = criarServidorReserva(criarSeedPrioridade(), {
    // Segunda-feira 23/11 às 10:00Z -> DENTRO da janela exclusiva de 24h (00:00Z de 23/11 a 00:00Z de 24/11)
    obterAgora: () => new Date('2026-11-23T10:00:00Z')
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    // 1. Consulta prioridade atual (calcula e persiste para a semana 2026-11-23)
    const respConsulta = await fetch(
      `http://127.0.0.1:${port}/api/v1/prioridades/atual?espacoId=espaco-lab-01&semana=2026-11-23`
    );
    const jsonConsulta = await respConsulta.json();

    assert.equal(respConsulta.status, 200);
    assert.equal(jsonConsulta.sucesso, true);
    assert.equal(jsonConsulta.dados.semanaReferencia, '2026-11-23');
    assert.equal(jsonConsulta.dados.prioridades.length, 1);
    assert.equal(jsonConsulta.dados.prioridades[0].cursoPrioritario.id, 'curso-ec');
    assert.equal(jsonConsulta.dados.prioridades[0].janelaExclusivaAtiva, true);

    // 2. Curso NÃO prioritário (BCC) tenta reservar horário nobre (19:00-21:00) dentro das 24h -> 403
    const respBloqueada = await fetch(`http://127.0.0.1:${port}/api/v1/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-usuario-id': 'user-bcc',
        'x-usuario-email': 'bcc@aluno.ufop.edu.br'
      },
      body: JSON.stringify({
        espacoId: 'espaco-lab-01',
        data: '2026-11-25',
        horarioInicio: '19:00',
        horarioFim: '21:00',
        numeroParticipantes: 10,
        finalidade: 'Tentativa em horário nobre sem prioridade'
      })
    });
    const jsonBloqueada = await respBloqueada.json();
    assert.equal(respBloqueada.status, 403);
    assert.equal(jsonBloqueada.erro.codigo, 'PRIORIDADE_ROTATIVA_ATIVA');

    // 3. Curso NÃO prioritário (BCC) reserva FORA do horário nobre (14:00-16:00) -> 201 permitido
    const respForaNobre = await fetch(`http://127.0.0.1:${port}/api/v1/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-usuario-id': 'user-bcc',
        'x-usuario-email': 'bcc@aluno.ufop.edu.br'
      },
      body: JSON.stringify({
        espacoId: 'espaco-lab-01',
        data: '2026-11-25',
        horarioInicio: '14:00',
        horarioFim: '16:00',
        numeroParticipantes: 10,
        finalidade: 'Estudo fora do horário nobre'
      })
    });
    assert.equal(respForaNobre.status, 201);

    // 4. Curso PRIORITÁRIO (EC) reserva horário nobre (19:00-21:00) dentro das 24h -> 201 permitido
    const respPrioritario = await fetch(`http://127.0.0.1:${port}/api/v1/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-usuario-id': 'user-ec',
        'x-usuario-email': 'ec@aluno.ufop.edu.br'
      },
      body: JSON.stringify({
        espacoId: 'espaco-lab-01',
        data: '2026-11-25',
        horarioInicio: '19:00',
        horarioFim: '21:00',
        numeroParticipantes: 12,
        finalidade: 'Reserva com prioridade rotativa da semana'
      })
    });
    assert.equal(respPrioritario.status, 201);
  } finally {
    server.close();
  }
});

test('P2.2 Integração — Após a janela exclusiva de 24h, qualquer curso pode reservar horário nobre normalmente', async () => {
  const { server, prioridadeService } = criarServidorReserva(criarSeedPrioridade(), {
    // Terça-feira 24/11 às 02:00Z -> APÓS o fim da janela de 24h (00:00Z de 24/11)
    obterAgora: () => new Date('2026-11-24T02:00:00Z')
  });
  prioridadeService.calcularPrioridadeSemanal('espaco-lab-01', '2026-11-23', {
    dataHoraReferencia: new Date('2026-11-24T02:00:00Z')
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const resp = await fetch(`http://127.0.0.1:${port}/api/v1/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-usuario-id': 'user-bcc',
        'x-usuario-email': 'bcc@aluno.ufop.edu.br'
      },
      body: JSON.stringify({
        espacoId: 'espaco-lab-01',
        data: '2026-11-25',
        horarioInicio: '19:00',
        horarioFim: '21:00',
        numeroParticipantes: 10,
        finalidade: 'Reserva em horário nobre após abertura geral da agenda'
      })
    });

    assert.equal(resp.status, 201);
  } finally {
    server.close();
  }
});

test('P2.2 Integração — POST /api/v1/prioridades/calcular é restrito a administradores', async () => {
  const { server } = criarServidorReserva(criarSeedPrioridade());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    // Estudante recebe 403
    const respEstudante = await fetch(`http://127.0.0.1:${port}/api/v1/prioridades/calcular`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-usuario-id': 'user-bcc',
        'x-usuario-email': 'bcc@aluno.ufop.edu.br',
        'x-usuario-perfil': 'ESTUDANTE'
      },
      body: JSON.stringify({ espacoId: 'espaco-lab-01', semanaReferencia: '2026-11-23' })
    });
    assert.equal(respEstudante.status, 403);

    // Administrador recebe 201
    const respAdmin = await fetch(`http://127.0.0.1:${port}/api/v1/prioridades/calcular`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-usuario-id': 'user-admin',
        'x-usuario-email': 'admin@ufop.edu.br',
        'x-usuario-perfil': 'ADMINISTRADOR'
      },
      body: JSON.stringify({ espacoId: 'espaco-lab-01', semanaReferencia: '2026-11-23' })
    });
    const jsonAdmin = await respAdmin.json();
    assert.equal(respAdmin.status, 201);
    assert.equal(jsonAdmin.dados.cursoPrioritario.id, 'curso-ec');
  } finally {
    server.close();
  }
});

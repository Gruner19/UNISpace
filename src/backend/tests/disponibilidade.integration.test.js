'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { criarServidorReserva } = require('../src/app');

/**
 * Retorna uma data 'YYYY-MM-DD' relativa a hoje (fuso local).
 * @param {number} dias
 * @returns {string}
 */
function dataRelativa(dias) {
  const data = new Date();
  data.setHours(12, 0, 0, 0);
  data.setDate(data.getDate() + dias);
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function criarSeed(data) {
  return {
    espacos: [
      {
        id: 'espaco-lab-01',
        codigo: 'LAB-204',
        nome: 'Laboratório de Engenharia de Software',
        tipo: 'LABORATORIO',
        capacidade: 30,
        localizacao: 'ICEB III - Sala 204',
        predio: 'ICEB III',
        ativo: true
      },
      {
        id: 'espaco-sala-01',
        codigo: 'SALA-101',
        nome: 'Sala de Estudo da Biblioteca',
        tipo: 'SALA_ESTUDO',
        capacidade: 12,
        localizacao: 'Biblioteca Central - Sala 101',
        predio: 'Biblioteca Central',
        ativo: true
      },
      {
        id: 'espaco-inativo-01',
        codigo: 'AUD-OFF',
        nome: 'Auditório em Reforma',
        tipo: 'AUDITORIO',
        capacidade: 120,
        localizacao: 'Prédio Central',
        predio: 'Prédio Central',
        ativo: false
      }
    ],
    usuarios: [
      {
        id: 'user-est-1',
        nome: 'Jordan Correa',
        emailInstitucional: 'jordan@aluno.ufop.edu.br',
        perfil: 'ESTUDANTE'
      }
    ],
    reservas: [
      {
        id: 'res-conf-1',
        codigoConfirmacao: 'RES-ABC123',
        espacoId: 'espaco-lab-01',
        usuarioId: 'user-est-1',
        data,
        horarioInicio: '09:00',
        horarioFim: '12:00',
        status: 'CONFIRMADA',
        contabilizaCota: true
      },
      {
        id: 'res-cancelada-1',
        codigoConfirmacao: 'RES-DEF456',
        espacoId: 'espaco-lab-01',
        usuarioId: 'user-est-1',
        data,
        horarioInicio: '07:00',
        horarioFim: '08:00',
        status: 'CANCELADA_USUARIO',
        contabilizaCota: false
      }
    ],
    bloqueios: [
      {
        id: 'bloq-1',
        espacoId: 'espaco-lab-01',
        dataInicio: data,
        dataFim: data,
        horarioInicio: '08:00',
        horarioFim: '10:00',
        motivo: 'Manutenção preventiva de rede',
        status: 'ATIVO'
      }
    ]
  };
}

async function enviarGet(porta, caminho, headers = {}) {
  const resposta = await fetch(`http://127.0.0.1:${porta}${caminho}`, { headers });
  const json = await resposta.json();
  return { status: resposta.status, json };
}

async function iniciarServidor(data) {
  const contexto = criarServidorReserva(criarSeed(data));
  await new Promise((resolve) => contexto.server.listen(0, '127.0.0.1', resolve));
  return { ...contexto, porta: contexto.server.address().port };
}

test('T5.1 Integração — GET disponibilidade retorna 200 com a grade de todos os espaços ativos', async () => {
  const data = dataRelativa(1);
  const { server, porta } = await iniciarServidor(data);

  try {
    const { status, json } = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?data=${data}`
    );

    assert.equal(status, 200);
    assert.equal(json.sucesso, true);
    assert.equal(json.dados.periodo.dataInicio, data);
    assert.equal(json.dados.periodo.intervaloSlotMinutos, 30);
    assert.equal(json.dados.totalEspacos, 2); // o espaço inativo não aparece (RN-12)
    assert.equal(json.dados.espacos[0].dias[0].slots.length, 30); // 07:00 às 22:00
    assert.equal(json.dados.espacos[0].dias[0].slots[0].horarioInicio, '07:00');
    assert.equal(json.dados.espacos[0].dias[0].slots.at(-1).horarioFim, '22:00');
  } finally {
    server.close();
  }
});

test('T5.1 Integração — Deve marcar slots LIVRE, BLOQUEADO e OCUPADO conforme reservas e bloqueios', async () => {
  const data = dataRelativa(1);
  const { server, porta } = await iniciarServidor(data);

  try {
    const { status, json } = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?espacoId=espaco-lab-01&data=${data}&horarioInicio=07:00&horarioFim=12:00`
    );

    assert.equal(status, 200);
    const espaco = json.dados.espacos[0];
    assert.equal(espaco.espacoId, 'espaco-lab-01');
    assert.equal(espaco.dias[0].slots.length, 10);

    const statusPorHorario = Object.fromEntries(
      espaco.dias[0].slots.map((slot) => [slot.horarioInicio, slot.status])
    );
    assert.equal(statusPorHorario['07:00'], 'LIVRE');
    assert.equal(statusPorHorario['08:00'], 'BLOQUEADO');
    assert.equal(statusPorHorario['09:00'], 'BLOQUEADO');
    assert.equal(statusPorHorario['10:00'], 'OCUPADO');
    assert.equal(statusPorHorario['11:30'], 'OCUPADO');

    const slotBloqueado = espaco.dias[0].slots.find((slot) => slot.status === 'BLOQUEADO');
    assert.equal(slotBloqueado.bloqueioId, 'bloq-1');
    assert.equal(slotBloqueado.motivo, 'Manutenção preventiva de rede');

    const slotOcupado = espaco.dias[0].slots.find((slot) => slot.status === 'OCUPADO');
    assert.equal(slotOcupado.reservaId, 'res-conf-1');

    assert.deepEqual(espaco.resumo, {
      totalSlots: 10,
      livres: 2,
      ocupados: 4,
      bloqueados: 4
    });
    assert.equal(json.dados.totalSlotsLivres, 2);
  } finally {
    server.close();
  }
});

test('T5.1 Integração — Deve filtrar por tipo, capacidade mínima e localização', async () => {
  const data = dataRelativa(1);
  const { server, porta } = await iniciarServidor(data);

  try {
    const porTipo = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?data=${data}&tipo=LABORATORIO&capacidadeMinima=20`
    );
    assert.equal(porTipo.status, 200);
    assert.equal(porTipo.json.dados.totalEspacos, 1);
    assert.equal(porTipo.json.dados.espacos[0].espacoId, 'espaco-lab-01');

    const porLocalizacao = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?data=${data}&localizacao=Biblioteca`
    );
    assert.equal(porLocalizacao.status, 200);
    assert.equal(porLocalizacao.json.dados.totalEspacos, 1);
    assert.equal(porLocalizacao.json.dados.espacos[0].espacoId, 'espaco-sala-01');
  } finally {
    server.close();
  }
});

test('T5.1 Integração — Deve retornar 200 com lista vazia quando nenhum espaço atende aos filtros', async () => {
  const data = dataRelativa(1);
  const { server, porta } = await iniciarServidor(data);

  try {
    const { status, json } = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?data=${data}&tipo=AUDITORIO`
    );

    assert.equal(status, 200);
    assert.equal(json.sucesso, true);
    assert.equal(json.dados.totalEspacos, 0);
    assert.equal(json.dados.espacos.length, 0);
    assert.match(json.mensagem, /Nenhum espaço encontrado/);
  } finally {
    server.close();
  }
});

test('T5.1 Integração — Deve consultar um período de até 7 dias e retornar uma agenda por dia', async () => {
  const inicio = dataRelativa(1);
  const fim = dataRelativa(3);
  const { server, porta } = await iniciarServidor(inicio);

  try {
    const { status, json } = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?dataInicio=${inicio}&dataFim=${fim}&espacoId=espaco-lab-01`
    );

    assert.equal(status, 200);
    assert.equal(json.dados.periodo.totalDias, 3);
    assert.equal(json.dados.espacos[0].dias.length, 3);
    assert.equal(json.dados.espacos[0].dias[0].resumo.ocupados, 4);
    assert.equal(json.dados.espacos[0].dias[1].resumo.ocupados, 0);
    assert.equal(json.dados.espacos[0].dias[2].resumo.ocupados, 0);
  } finally {
    server.close();
  }
});

test('T5.1 Integração — Deve retornar 404 para espaço inexistente ou inativo (RN-12)', async () => {
  const data = dataRelativa(1);
  const { server, porta } = await iniciarServidor(data);

  try {
    const inexistente = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?data=${data}&espacoId=espaco-inexistente`
    );
    assert.equal(inexistente.status, 404);
    assert.equal(inexistente.json.erro.codigo, 'ESPACO_NAO_ENCONTRADO');

    const inativo = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?data=${data}&espacoId=espaco-inativo-01`
    );
    assert.equal(inativo.status, 404);
    assert.equal(inativo.json.erro.codigo, 'ESPACO_INATIVO');
  } finally {
    server.close();
  }
});

test('T5.1 Integração — Deve retornar 400 para data inválida, passada, período longo e horários incoerentes', async () => {
  const data = dataRelativa(1);
  const { server, porta } = await iniciarServidor(data);

  try {
    const dataInvalida = await enviarGet(
      porta,
      '/api/v1/espacos/disponibilidade?data=2026-02-30'
    );
    assert.equal(dataInvalida.status, 400);
    assert.equal(dataInvalida.json.erro.codigo, 'DATA_INVALIDA');

    const dataPassada = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?data=${dataRelativa(-1)}`
    );
    assert.equal(dataPassada.status, 400);
    assert.equal(dataPassada.json.erro.codigo, 'DATA_NO_PASSADO');

    const periodoLongo = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?dataInicio=${dataRelativa(1)}&dataFim=${dataRelativa(8)}`
    );
    assert.equal(periodoLongo.status, 400);
    assert.equal(periodoLongo.json.erro.codigo, 'PERIODO_DATAS_EXCEDIDO');

    const horarioIncoerente = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?data=${data}&horarioInicio=16:00&horarioFim=14:00`
    );
    assert.equal(horarioIncoerente.status, 400);
    assert.equal(horarioIncoerente.json.erro.codigo, 'INTERVALO_HORARIO_INCOERENTE');
  } finally {
    server.close();
  }
});

test('T5.1 Integração — Consulta é pública: token inválido não bloqueia o acesso (auth opcional)', async () => {
  const data = dataRelativa(1);
  const { server, porta } = await iniciarServidor(data);

  try {
    const { status, json } = await enviarGet(
      porta,
      `/api/v1/espacos/disponibilidade?data=${data}&tipo=LABORATORIO`,
      { Authorization: 'Bearer token-invalido' }
    );

    assert.equal(status, 200);
    assert.equal(json.sucesso, true);
    assert.equal(json.dados.totalEspacos, 1);
  } finally {
    server.close();
  }
});

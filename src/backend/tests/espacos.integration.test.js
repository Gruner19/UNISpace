'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { criarServidorReserva } = require('../src/app');

function criarSeedEspacos() {
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
        duracaoMinimaMinutos: 30,
        duracaoMaximaMinutos: 180,
        blocoMinutos: 30,
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
        duracaoMinimaMinutos: 30,
        duracaoMaximaMinutos: 120,
        blocoMinutos: 30,
        ativo: true
      },
      {
        id: 'espaco-aud-01',
        codigo: 'AUD-01',
        nome: 'Auditório Principal',
        tipo: 'AUDITORIO',
        capacidade: 120,
        localizacao: 'Prédio Central - Térreo',
        predio: 'Prédio Central',
        duracaoMinimaMinutos: 60,
        duracaoMaximaMinutos: 240,
        blocoMinutos: 60,
        ativo: true
      },
      {
        id: 'espaco-quadra-01',
        codigo: 'QUADRA-01',
        nome: 'Quadra Poliesportiva',
        tipo: 'AREA_ESPORTIVA',
        capacidade: 40,
        localizacao: 'Complexo Esportivo',
        predio: 'Complexo Esportivo',
        duracaoMinimaMinutos: 60,
        duracaoMaximaMinutos: 120,
        blocoMinutos: 60,
        ativo: true
      }
    ],
    usuarios: [],
    reservas: [],
    bloqueios: []
  };
}

async function enviarGetEspacos(porta) {
  const resposta = await fetch(`http://127.0.0.1:${porta}/api/v1/espacos`);
  const json = await resposta.json();
  return { status: resposta.status, json };
}

test('T6.3 Integração — Deve listar espaços de prova com HTTP 200', async () => {
  const { server } = criarServidorReserva(criarSeedEspacos());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const { status, json } = await enviarGetEspacos(port);

    assert.equal(status, 200);
    assert.ok(Array.isArray(json.dados));
    assert.equal(json.sucesso, true);

    // Verifica que todos os 4 espaços estão presentes
    assert.equal(json.dados.length, 4);

    // Verifica cada espaço tem os campos esperados
    const ids = json.dados.map((e) => e.id);
    assert.ok(ids.includes('espaco-lab-01'));
    assert.ok(ids.includes('espaco-sala-01'));
    assert.ok(ids.includes('espaco-aud-01'));
    assert.ok(ids.includes('espaco-quadra-01'));

    // Verifica os campos de cada espaço
    json.dados.forEach((espaco) => {
      assert.ok(espaco.id, 'Espaço deve ter id');
      assert.ok(espaco.nome, 'Espaço deve ter nome');
      assert.ok(espaco.tipo, 'Espaço deve ter tipo');
      assert.ok(espaco.capacidade !== undefined, 'Espaço deve ter capacidade');
    });
  } finally {
    server.close();
  }
});

test('T6.3 Integração — Cada espaço tem apenas os campos id, nome, tipo, capacidade na resposta', async () => {
  const { server } = criarServidorReserva(criarSeedEspacos());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const { status, json } = await enviarGetEspacos(port);

    assert.equal(status, 200);

    // Verifica que cada espaço tem apenas os campos esperados (id, nome, tipo, capacidade)
    // e NÃO tem campos inesperados como codigo, localizacao, etc.
    json.dados.forEach((espaco) => {
      const camposPermitidos = ['id', 'nome', 'tipo', 'capacidade'];
      const camposDoObjeto = Object.keys(espaco);
      assert.deepStrictEqual(camposDoObjeto, camposPermitidos,
        `Espaço deveria ter apenas ${camposPermitidos.join(', ')}, mas tem: ${camposDoObjeto.join(', ')}`);
    });
  } finally {
    server.close();
  }
});
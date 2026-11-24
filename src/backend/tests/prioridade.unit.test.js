'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ReservaRepository } = require('../src/repositories/reservaRepository');
const { PrioridadeRepository } = require('../src/repositories/prioridadeRepository');
const {
  PrioridadeService,
  obterInicioSemanaISO,
  somarDiasISO
} = require('../src/services/prioridadeService');

function criarCenarioUnitario(reservasSemanaAnterior = []) {
  const cursos = [
    { id: 'curso-bcc', codigo: 'BCC', nome: 'Ciência da Computação', faculdade: 'ICEB' },
    { id: 'curso-ec', codigo: 'ENG-COMP', nome: 'Engenharia de Computação', faculdade: 'ICEA' },
    { id: 'curso-si', codigo: 'SI', nome: 'Sistemas de Informação', faculdade: 'ICEA' }
  ];

  const reservaRepository = new ReservaRepository({
    espacos: [
      {
        id: 'espaco-lab-01',
        codigo: 'LAB-204',
        nome: 'Laboratório de Software',
        tipo: 'LABORATORIO',
        capacidade: 30,
        horarioNobreInicio: '18:00',
        horarioNobreFim: '22:00',
        ativo: true
      }
    ],
    usuarios: [
      { id: 'u-bcc', nome: 'Aluno BCC', emailInstitucional: 'bcc@aluno.ufop.edu.br', cursoId: 'curso-bcc', perfil: 'ESTUDANTE' },
      { id: 'u-ec', nome: 'Aluno EC', emailInstitucional: 'ec@aluno.ufop.edu.br', cursoId: 'curso-ec', perfil: 'ESTUDANTE' },
      { id: 'u-si', nome: 'Aluno SI', emailInstitucional: 'si@aluno.ufop.edu.br', cursoId: 'curso-si', perfil: 'ESTUDANTE' }
    ],
    reservas: reservasSemanaAnterior
  });

  const prioridadeRepository = new PrioridadeRepository({ cursos });
  const prioridadeService = new PrioridadeService(prioridadeRepository, reservaRepository);

  return { reservaRepository, prioridadeRepository, prioridadeService };
}

test('P2.2 Unitário — obterInicioSemanaISO calcula corretamente a segunda-feira da semana', () => {
  // 2026-11-26 é quinta-feira -> segunda-feira é 2026-11-23
  assert.equal(obterInicioSemanaISO('2026-11-26'), '2026-11-23');
  // 2026-11-29 é domingo -> segunda-feira é 2026-11-23
  assert.equal(obterInicioSemanaISO('2026-11-29'), '2026-11-23');
  assert.equal(somarDiasISO('2026-11-23', -7), '2026-11-16');
});

test('P2.2 Unitário — RN-04: Seleciona automaticamente o curso com menor uso de horas na semana anterior', () => {
  // Semana atual começa em 2026-11-23; semana anterior é 2026-11-16 a 2026-11-22
  const { prioridadeService, reservaRepository } = criarCenarioUnitario([
    {
      id: 'r-1',
      espacoId: 'espaco-lab-01',
      usuarioId: 'u-bcc',
      data: '2026-11-17',
      duracaoMinutos: 180, // BCC = 3h
      status: 'CONCLUIDA'
    },
    {
      id: 'r-2',
      espacoId: 'espaco-lab-01',
      usuarioId: 'u-ec',
      data: '2026-11-18',
      duracaoMinutos: 60, // EC = 1h
      status: 'CONCLUIDA'
    },
    {
      id: 'r-3',
      espacoId: 'espaco-lab-01',
      usuarioId: 'u-si',
      data: '2026-11-19',
      duracaoMinutos: 120, // SI = 2h
      status: 'CONFIRMADA'
    }
  ]);

  const resultado = prioridadeService.calcularPrioridadeSemanal('espaco-lab-01', '2026-11-23', {
    dataHoraReferencia: new Date('2026-11-23T10:00:00Z')
  });

  assert.equal(resultado.cursoPrioritario.id, 'curso-ec');
  assert.equal(resultado.horasUsadasSemanaAnterior, 1);
  assert.equal(resultado.desempatePorSorteio, false);
  assert.equal(resultado.janelaExclusivaAtiva, true);
  assert.equal(reservaRepository.auditoria.length, 0); // sem empate, não houve sorteio
});

test('P2.2 Unitário — RN-04 & RN-13: Empate na semana anterior é resolvido por sorteio auditado', () => {
  // Todos os 3 cursos usaram 0h na semana anterior -> empate
  const { prioridadeService, reservaRepository } = criarCenarioUnitario([]);

  const resultado = prioridadeService.calcularPrioridadeSemanal('espaco-lab-01', '2026-11-23', {
    sortearIndice: () => 2, // força seleção do 3º curso empatado (SI)
    usuarioExecutorId: 'user-admin-1',
    dataHoraReferencia: new Date('2026-11-23T08:00:00Z')
  });

  assert.equal(resultado.desempatePorSorteio, true);
  assert.equal(resultado.cursoPrioritario.id, 'curso-si');
  assert.equal(reservaRepository.auditoria.length, 1);
  assert.equal(reservaRepository.auditoria[0].acao, 'SORTEIO_PRIORIDADE');
  assert.equal(reservaRepository.auditoria[0].detalhes.cursoVencedorId, 'curso-si');
  assert.equal(reservaRepository.auditoria[0].detalhes.cursosEmpatados.length, 3);
});

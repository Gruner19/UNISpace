'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validarConsultaDisponibilidade,
  gerarIntervaloDatas,
  diferencaEmDias
} = require('../src/validators/disponibilidadeValidator');
const { DisponibilidadeService } = require('../src/services/disponibilidadeService');
const { DisponibilidadeRepository } = require('../src/repositories/disponibilidadeRepository');
const { ReservaRepository } = require('../src/repositories/reservaRepository');

/**
 * Retorna uma data 'YYYY-MM-DD' relativa a hoje (fuso local), sempre ao meio-dia
 * para evitar problemas de virada de dia/DST nos testes.
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

function criarServicoComSeed(data) {
  const reservaRepository = new ReservaRepository({
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
    reservas: [
      {
        id: 'res-conf-1',
        espacoId: 'espaco-lab-01',
        data,
        horarioInicio: '09:00',
        horarioFim: '12:00',
        status: 'CONFIRMADA'
      },
      {
        id: 'res-cancelada-1',
        espacoId: 'espaco-lab-01',
        data,
        horarioInicio: '07:00',
        horarioFim: '08:00',
        status: 'CANCELADA_USUARIO'
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
        motivo: 'Manutenção preventiva',
        status: 'ATIVO'
      }
    ]
  });

  const service = new DisponibilidadeService(new DisponibilidadeRepository(reservaRepository));
  return { service, reservaRepository };
}

test('T5.1 Unitário — Deve aplicar os valores padrão de data, turno e expediente do campus', () => {
  const filtros = validarConsultaDisponibilidade({});

  assert.equal(filtros.datas.length, 1);
  assert.equal(filtros.datas[0], dataRelativa(0));
  assert.equal(filtros.turno, 'INTEGRAL');
  assert.equal(filtros.horarioInicio, '07:00');
  assert.equal(filtros.horarioFim, '22:00');
  assert.equal(filtros.tipo, null);
  assert.equal(filtros.capacidadeMinima, null);
});

test('T5.1 Unitário — Deve aceitar um dia, normalizar filtros e mapear o turno para uma janela', () => {
  const data = dataRelativa(1);
  const filtros = validarConsultaDisponibilidade({
    data,
    tipo: 'Laboratório',
    capacidadeMinima: '20',
    localizacao: 'ICEB',
    turno: 'Tarde'
  });

  assert.equal(filtros.dataInicio, data);
  assert.equal(filtros.dataFim, data);
  assert.equal(filtros.tipo, 'LABORATORIO');
  assert.equal(filtros.capacidadeMinima, 20);
  assert.equal(filtros.localizacao, 'ICEB');
  assert.equal(filtros.turno, 'TARDE');
  assert.equal(filtros.horarioInicio, '12:00');
  assert.equal(filtros.horarioFim, '18:00');
});

test('T5.1 Unitário — Deve gerar intervalo inclusivo e rejeitar períodos acima de 7 dias', () => {
  const inicio = dataRelativa(1);
  const fim = dataRelativa(7);

  assert.equal(gerarIntervaloDatas(inicio, fim).length, 7);
  assert.equal(diferencaEmDias(inicio, fim), 6);

  const filtros = validarConsultaDisponibilidade({ dataInicio: inicio, dataFim: fim });
  assert.equal(filtros.datas.length, 7);

  assert.throws(
    () => validarConsultaDisponibilidade({ dataInicio: inicio, dataFim: dataRelativa(8) }),
    (err) => err.codigo === 'PERIODO_DATAS_EXCEDIDO' && err.statusHttp === 400
  );
});

test('T5.1 Unitário — Deve rejeitar datas inválidas, passadas, períodos invertidos e parâmetros conflitantes', () => {
  assert.throws(
    () => validarConsultaDisponibilidade({ data: '2026-02-30' }),
    (err) => err.codigo === 'DATA_INVALIDA' && err.statusHttp === 400
  );

  assert.throws(
    () => validarConsultaDisponibilidade({ data: dataRelativa(-1) }),
    (err) => err.codigo === 'DATA_NO_PASSADO' && err.statusHttp === 400
  );

  assert.throws(
    () =>
      validarConsultaDisponibilidade({
        dataInicio: dataRelativa(2),
        dataFim: dataRelativa(1)
      }),
    (err) => err.codigo === 'PERIODO_DATAS_INVALIDO'
  );

  assert.throws(
    () =>
      validarConsultaDisponibilidade({
        data: dataRelativa(1),
        dataInicio: dataRelativa(1),
        dataFim: dataRelativa(2)
      }),
    (err) => err.codigo === 'PARAMETROS_DATA_CONFLITANTES'
  );

  assert.throws(
    () => validarConsultaDisponibilidade({ dataInicio: dataRelativa(1) }),
    (err) => err.codigo === 'PERIODO_DATAS_OBRIGATORIO'
  );
});

test('T5.1 Unitário — Deve validar janela de horários, grade de slots e filtros físicos', () => {
  assert.throws(
    () =>
      validarConsultaDisponibilidade({
        data: dataRelativa(1),
        horarioInicio: '16:00',
        horarioFim: '14:00'
      }),
    (err) => err.codigo === 'INTERVALO_HORARIO_INCOERENTE'
  );

  assert.throws(
    () =>
      validarConsultaDisponibilidade({
        data: dataRelativa(1),
        horarioInicio: '06:00',
        horarioFim: '10:00'
      }),
    (err) => err.codigo === 'HORARIO_FORA_DO_EXPEDIENTE'
  );

  assert.throws(
    () =>
      validarConsultaDisponibilidade({
        data: dataRelativa(1),
        horarioInicio: '07:15',
        horarioFim: '08:00'
      }),
    (err) => err.codigo === 'HORARIO_FORA_DA_GRADE'
  );

  assert.throws(
    () => validarConsultaDisponibilidade({ data: dataRelativa(1), horarioInicio: '08:00' }),
    (err) => err.codigo === 'HORARIO_INCOMPLETO'
  );

  assert.throws(
    () => validarConsultaDisponibilidade({ data: dataRelativa(1), tipo: 'CASTELO' }),
    (err) => err.codigo === 'TIPO_ESPACO_INVALIDO'
  );

  assert.throws(
    () => validarConsultaDisponibilidade({ data: dataRelativa(1), capacidadeMinima: 'abc' }),
    (err) => err.codigo === 'CAPACIDADE_MINIMA_INVALIDA'
  );
});

test('T5.1 Unitário — Deve classificar slots com prioridade do bloqueio (RN-06) sobre a reserva (RN-01)', () => {
  const data = dataRelativa(1);
  const { service } = criarServicoComSeed(data);

  const filtros = validarConsultaDisponibilidade({
    data,
    espacoId: 'espaco-lab-01',
    horarioInicio: '07:00',
    horarioFim: '12:00'
  });
  assert.equal(filtros.turno, null); // horários explícitos não são um turno predefinido
  const agenda = service.consultarDisponibilidade(filtros);
  const espaco = agenda.espacos[0];
  const statusPorHorario = Object.fromEntries(
    espaco.dias[0].slots.map((slot) => [slot.horarioInicio, slot.status])
  );

  assert.equal(espaco.dias[0].slots.length, 10);
  assert.equal(statusPorHorario['07:00'], 'LIVRE'); // reserva cancelada não ocupa
  assert.equal(statusPorHorario['08:00'], 'BLOQUEADO');
  assert.equal(statusPorHorario['09:00'], 'BLOQUEADO'); // bloqueio vence a reserva sobreposta
  assert.equal(statusPorHorario['09:30'], 'BLOQUEADO');
  assert.equal(statusPorHorario['10:00'], 'OCUPADO');
  assert.equal(statusPorHorario['11:30'], 'OCUPADO');
  assert.deepEqual(espaco.resumo, {
    totalSlots: 10,
    livres: 2,
    ocupados: 4,
    bloqueados: 4
  });
  assert.equal(espaco.disponivelNoPeriodo, true);
  assert.ok(
    ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'].includes(
      espaco.dias[0].diaSemana
    )
  );
});

test('T5.1 Unitário — Deve montar múltiplos dias e filtrar espaços por tipo, capacidade e localização', () => {
  const data = dataRelativa(1);
  const { service } = criarServicoComSeed(data);

  const porTipo = service.consultarDisponibilidade(
    validarConsultaDisponibilidade({ data, tipo: 'LABORATORIO', capacidadeMinima: '20' })
  );
  assert.equal(porTipo.totalEspacos, 1);
  assert.equal(porTipo.espacos[0].espacoId, 'espaco-lab-01');

  const porLocalizacao = service.consultarDisponibilidade(
    validarConsultaDisponibilidade({ data, localizacao: 'biblioteca' })
  );
  assert.equal(porLocalizacao.totalEspacos, 1);
  assert.equal(porLocalizacao.espacos[0].espacoId, 'espaco-sala-01');

  const semResultados = service.consultarDisponibilidade(
    validarConsultaDisponibilidade({ data, tipo: 'AUDITORIO' })
  );
  assert.equal(semResultados.totalEspacos, 0);
  assert.equal(semResultados.espacos.length, 0);

  const doisDias = service.consultarDisponibilidade(
    validarConsultaDisponibilidade({
      dataInicio: data,
      dataFim: dataRelativa(2),
      espacoId: 'espaco-lab-01'
    })
  );
  assert.equal(doisDias.periodo.totalDias, 2);
  assert.equal(doisDias.espacos[0].dias.length, 2);
  assert.equal(doisDias.espacos[0].dias[1].resumo.ocupados, 0);
});

test('T5.1 Unitário — Deve retornar 404 para espaço inexistente ou inativo (RN-12)', () => {
  const data = dataRelativa(1);
  const { service } = criarServicoComSeed(data);

  assert.throws(
    () =>
      service.consultarDisponibilidade(
        validarConsultaDisponibilidade({ data, espacoId: 'espaco-inexistente' })
      ),
    (err) => err.codigo === 'ESPACO_NAO_ENCONTRADO' && err.statusHttp === 404
  );

  assert.throws(
    () =>
      service.consultarDisponibilidade(
        validarConsultaDisponibilidade({ data, espacoId: 'espaco-inativo-01' })
      ),
    (err) => err.codigo === 'ESPACO_INATIVO' && err.statusHttp === 404
  );
});

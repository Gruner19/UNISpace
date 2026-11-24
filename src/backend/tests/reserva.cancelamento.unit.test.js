'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validarPayloadCancelamentoReserva,
  avaliarPrazoCancelamento
} = require('../src/validators/reservaValidator');

test('T7.1 Unitário — validarPayloadCancelamentoReserva aceita payload ausente ou motivo válido', () => {
  assert.equal(validarPayloadCancelamentoReserva(undefined), true);
  assert.equal(validarPayloadCancelamentoReserva(null), true);
  assert.equal(validarPayloadCancelamentoReserva({}), true);
  assert.equal(validarPayloadCancelamentoReserva({ motivo: 'Imprevisto acadêmico' }), true);
});

test('T7.1 Unitário — validarPayloadCancelamentoReserva rejeita motivo inválido ou muito longo', () => {
  assert.throws(
    () => validarPayloadCancelamentoReserva({ motivo: 123 }),
    (err) => err.codigo === 'MOTIVO_INVALIDO' && err.statusHttp === 400
  );

  assert.throws(
    () => validarPayloadCancelamentoReserva({ motivo: 'a'.repeat(301) }),
    (err) => err.codigo === 'MOTIVO_MUITO_LONGO' && err.statusHttp === 400
  );
});

test('T7.1 Unitário — RN-05: Cancelamento com >= 2h de antecedência não contabiliza na cota', () => {
  const reserva = { data: '2026-11-26', horarioInicio: '14:00' };
  const agora = new Date('2026-11-26T12:00:00Z'); // exatamente 2h antes

  const resultado = avaliarPrazoCancelamento(reserva, agora);
  assert.equal(resultado.dentroDoPrazoSemPenalidade, true);
  assert.equal(resultado.contabilizaCota, false);
  assert.equal(resultado.horasAntecedencia, 2);
});

test('T7.1 Unitário — RN-05: Cancelamento com < 2h de antecedência é permitido mas conta na cota', () => {
  const reserva = { data: '2026-11-26', horarioInicio: '14:00' };
  const agora = new Date('2026-11-26T13:00:00Z'); // 1h antes

  const resultado = avaliarPrazoCancelamento(reserva, agora);
  assert.equal(resultado.dentroDoPrazoSemPenalidade, false);
  assert.equal(resultado.contabilizaCota, true);
  assert.equal(resultado.horasAntecedencia, 1);
});

test('T7.1 Unitário — RN-05: Cancelamento após o início da reserva é bloqueado com 422', () => {
  const reserva = { data: '2026-11-26', horarioInicio: '14:00' };
  const agora = new Date('2026-11-26T14:05:00Z'); // já iniciou

  assert.throws(
    () => avaliarPrazoCancelamento(reserva, agora),
    (err) => err.codigo === 'PRAZO_CANCELAMENTO_EXPIRADO' && err.statusHttp === 422
  );
});

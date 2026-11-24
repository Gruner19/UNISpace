'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validarIdReserva,
  validarPayloadRejeicaoReserva
} = require('../src/validators/reservaValidator');

test('T9.1 Unitário — validarIdReserva aceita ID não vazio', () => {
  assert.equal(validarIdReserva('res-123'), true);
  assert.equal(validarIdReserva('uuid-qualquer'), true);
});

test('T9.1 Unitário — validarIdReserva rejeita ID ausente ou vazio', () => {
  [null, undefined, '', '   '].forEach((idInvalido) => {
    assert.throws(
      () => validarIdReserva(idInvalido),
      (err) => err.codigo === 'RESERVA_ID_OBRIGATORIO' && err.statusHttp === 400
    );
  });
});

test('T9.1 Unitário — validarPayloadRejeicaoReserva aceita payload ausente ou válido', () => {
  assert.equal(validarPayloadRejeicaoReserva(undefined), true);
  assert.equal(validarPayloadRejeicaoReserva(null), true);
  assert.equal(validarPayloadRejeicaoReserva({}), true);
  assert.equal(validarPayloadRejeicaoReserva({ motivo: 'Motivo da rejeição' }), true);
});

test('T9.1 Unitário — validarPayloadRejeicaoReserva rejeita motivo não string e payload não objeto', () => {
  assert.throws(
    () => validarPayloadRejeicaoReserva({ motivo: 123 }),
    (err) => err.codigo === 'MOTIVO_INVALIDO' && err.statusHttp === 400
  );
  assert.throws(
    () => validarPayloadRejeicaoReserva('string em vez de objeto'),
    (err) => err.codigo === 'PAYLOAD_INVALIDO' && err.statusHttp === 400
  );
});

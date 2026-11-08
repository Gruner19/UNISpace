'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calcularDuracaoMinutos,
  intervalosConflitam,
  validarEmailInstitucional,
  validarDuracaoReserva,
  validarCapacidadeEspaco
} = require('../src/validators/reservaValidator');

test('T6.2 Unitário — RN-02: Deve aceitar e-mails institucionais e rejeitar domínios externos', () => {
  assert.equal(validarEmailInstitucional('estudante@aluno.ufop.edu.br'), true);
  assert.equal(validarEmailInstitucional('docente@ufop.edu.br'), true);
  assert.equal(validarEmailInstitucional('jordan@unitru.edu.pe'), true);

  assert.throws(
    () => validarEmailInstitucional('usuario@gmail.com'),
    (err) => err.codigo === 'EMAIL_NAO_INSTITUCIONAL' && err.statusHttp === 403
  );
});

test('T6.2 Unitário — RN-08: Deve validar duração mínima, máxima e blocos por tipo de espaço', () => {
  const salaEstudo = { tipo: 'SALA_ESTUDO' }; // 30m a 120m (bloco 30m)
  const auditorio = { tipo: 'AUDITORIO' }; // 60m a 240m (bloco 60m)

  assert.equal(validarDuracaoReserva(salaEstudo, 60), true);
  assert.equal(validarDuracaoReserva(salaEstudo, 120), true);
  assert.equal(validarDuracaoReserva(auditorio, 180), true);

  // Acima de 2h em sala de estudo deve falhar
  assert.throws(
    () => validarDuracaoReserva(salaEstudo, 150),
    (err) => err.codigo === 'DURACAO_FORA_DO_LIMITE' && err.statusHttp === 422
  );

  // Bloco quebrado (90 min em auditório que exige blocos de 60 min) deve falhar
  assert.throws(
    () => validarDuracaoReserva(auditorio, 90),
    (err) => err.codigo === 'BLOCO_DURACAO_INVALIDO' && err.statusHttp === 422
  );
});

test('T6.2 Unitário — RN-09: Deve validar se o número de participantes respeita a capacidade máxima', () => {
  const laboratorio = { capacidade: 25 };

  assert.equal(validarCapacidadeEspaco(laboratorio, 25), true);
  assert.throws(
    () => validarCapacidadeEspaco(laboratorio, 26),
    (err) => err.codigo === 'CAPACIDADE_EXCEDIDA' && err.statusHttp === 422
  );
});

test('T6.2 Unitário — RN-01: Deve detectar sobreposição de intervalos corretamente', () => {
  assert.equal(calcularDuracaoMinutos('14:00', '16:00'), 120);

  // Intervalos sobrepostos (14:00-16:00 e 15:00-17:00)
  assert.equal(intervalosConflitam('14:00', '16:00', '15:00', '17:00'), true);

  // Intervalos adjacentes (14:00-16:00 e 16:00-18:00) NÃO conflitam
  assert.equal(intervalosConflitam('14:00', '16:00', '16:00', '18:00'), false);
});

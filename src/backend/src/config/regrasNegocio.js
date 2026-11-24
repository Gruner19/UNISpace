'use strict';

/**
 * Parâmetros oficiais das Regras de Negócio do UNISpace (decididos em P0.5 / T13).
 */
const REGRAS_NEGOCIO = Object.freeze({
  // RN-02: Domínios de e-mail institucional aceitos
  DOMINIOS_INSTITUCIONAIS: [
    'ufop.edu.br',
    'aluno.ufop.edu.br',
    'unitru.edu.pe',
    'universidade.br',
    'unispace.edu.br'
  ],

  // RN-03: Cotas de equidade
  COTA_SEMANAL_MAXIMA_HORAS: 6.0,
  MAX_RESERVAS_ATIVAS_FUTURAS: 2,
  ANTECEDENCIA_MAXIMA_DIAS: 14,
  COTA_CURSO_ESPACO_PERCENTUAL_MAX: 40.0,

  // RN-05: Cancelamento e penalidades
  PRAZO_CANCELAMENTO_SEM_PENALIDADE_HORAS: 2,
  LIMITE_NO_SHOWS_30_DIAS: 3,
  DIAS_SUSPENSAO_POR_NO_SHOW: 7,

  // RN-08: Limites de duração e blocos por tipo de espaço (em minutos)
  LIMITES_DURACAO_POR_TIPO: Object.freeze({
    SALA_ESTUDO: Object.freeze({ minMinutos: 30, maxMinutos: 120, blocoMinutos: 30 }),
    LABORATORIO: Object.freeze({ minMinutos: 30, maxMinutos: 180, blocoMinutos: 30 }),
    AUDITORIO: Object.freeze({ minMinutos: 60, maxMinutos: 240, blocoMinutos: 60 }),
    AREA_ESPORTIVA: Object.freeze({ minMinutos: 60, maxMinutos: 120, blocoMinutos: 60 })
  }),

  // T5.1 / CU-02: parâmetros da consulta de disponibilidade
  HORARIO_ABERTURA_CAMPUS: '07:00',
  HORARIO_FECHAMENTO_CAMPUS: '22:00',
  INTERVALO_SLOT_DISPONIBILIDADE_MINUTOS: 30,
  MAX_DIAS_CONSULTA_DISPONIBILIDADE: 7,
  TIPOS_ESPACO: Object.freeze([
    'SALA_ESTUDO',
    'LABORATORIO',
    'AUDITORIO',
    'AREA_ESPORTIVA'
  ]),
  TURNOS_DISPONIBILIDADE: Object.freeze({
    MANHA: Object.freeze({ inicio: '07:00', fim: '12:00' }),
    TARDE: Object.freeze({ inicio: '12:00', fim: '18:00' }),
    NOITE: Object.freeze({ inicio: '18:00', fim: '22:00' }),
    INTEGRAL: Object.freeze({ inicio: '07:00', fim: '22:00' })
  })
});

module.exports = { REGRAS_NEGOCIO };

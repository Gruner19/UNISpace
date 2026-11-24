'use strict';

const { REGRAS_NEGOCIO } = require('../config/regrasNegocio');
const { ErroDominioReserva } = require('../utils/errosDominio');

/**
 * Converte uma string 'HH:MM' em minutos desde 00:00.
 * @param {string} horario
 * @returns {number}
 */
function converterHorarioParaMinutos(horario) {
  if (typeof horario !== 'string' || !/^\d{2}:\d{2}$/.test(horario)) {
    throw new ErroDominioReserva(
      'FORMATO_HORARIO_INVALIDO',
      'O horário deve estar no formato HH:MM (ex.: 14:00).',
      400
    );
  }
  const [horas, minutos] = horario.split(':').map(Number);
  if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
    throw new ErroDominioReserva(
      'VALOR_HORARIO_INVALIDO',
      'Horário fora do intervalo válido do relógio (00:00 a 23:59).',
      400
    );
  }
  return horas * 60 + minutos;
}

/**
 * Calcula a duração em minutos e garante coerência entre início e fim.
 */
function calcularDuracaoMinutos(horarioInicio, horarioFim) {
  const inicioMin = converterHorarioParaMinutos(horarioInicio);
  const fimMin = converterHorarioParaMinutos(horarioFim);
  if (fimMin <= inicioMin) {
    throw new ErroDominioReserva(
      'INTERVALO_HORARIO_INCOERENTE',
      'O horário final deve ser estritamente posterior ao horário inicial.',
      400
    );
  }
  return fimMin - inicioMin;
}

/**
 * RN-01: Verifica se dois intervalos [inicio1, fim1) e [inicio2, fim2) se sobrepõem.
 */
function intervalosConflitam(horarioInicio1, horarioFim1, horarioInicio2, horarioFim2) {
  const s1 = converterHorarioParaMinutos(horarioInicio1);
  const e1 = converterHorarioParaMinutos(horarioFim1);
  const s2 = converterHorarioParaMinutos(horarioInicio2);
  const e2 = converterHorarioParaMinutos(horarioFim2);
  return s1 < e2 && e1 > s2;
}

/**
 * RN-02: Valida se o e-mail pertence a um domínio institucional homologado.
 */
function validarEmailInstitucional(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new ErroDominioReserva(
      'EMAIL_NAO_INSTITUCIONAL',
      'A realização de reservas é restrita a usuários autenticados com e-mail institucional (RN-02).',
      403
    );
  }
  const dominio = email.trim().toLowerCase().split('@').pop();
  const valido = REGRAS_NEGOCIO.DOMINIOS_INSTITUCIONAIS.some(
    (domPermitido) => dominio === domPermitido || dominio.endsWith(`.${domPermitido}`)
  );
  if (!valido) {
    throw new ErroDominioReserva(
      'EMAIL_NAO_INSTITUCIONAL',
      `O domínio de e-mail "@${dominio}" não é institucional. Utilize seu e-mail universitário oficial (RN-02).`,
      403,
      { dominioInformado: dominio, dominiosAceitos: REGRAS_NEGOCIO.DOMINIOS_INSTITUCIONAIS }
    );
  }
  return true;
}

/**
 * RN-08: Valida a duração mínima, máxima e alinhamento de bloco conforme o tipo de espaço.
 */
function validarDuracaoReserva(espaco, duracaoMinutos) {
  const regraTipo = REGRAS_NEGOCIO.LIMITES_DURACAO_POR_TIPO[espaco.tipo] || {
    minMinutos: 30,
    maxMinutos: 180,
    blocoMinutos: 30
  };

  const minMinutos = espaco.duracaoMinimaMinutos ?? regraTipo.minMinutos;
  const maxMinutos = espaco.duracaoMaximaMinutos ?? regraTipo.maxMinutos;
  const blocoMinutos = espaco.blocoMinutos ?? regraTipo.blocoMinutos;

  if (duracaoMinutos < minMinutos || duracaoMinutos > maxMinutos) {
    throw new ErroDominioReserva(
      'DURACAO_FORA_DO_LIMITE',
      `A duração da reserva (${duracaoMinutos} min) deve respeitar o limite deste espaço: mínimo ${minMinutos} min e máximo ${maxMinutos} min (RN-08).`,
      422,
      { duracaoSolicitadaMinutos: duracaoMinutos, minMinutos, maxMinutos }
    );
  }

  if (duracaoMinutos % blocoMinutos !== 0) {
    throw new ErroDominioReserva(
      'BLOCO_DURACAO_INVALIDO',
      `A duração da reserva deve ser múltipla de ${blocoMinutos} minutos para este tipo de espaço (RN-08).`,
      422,
      { duracaoSolicitadaMinutos: duracaoMinutos, blocoMinutos }
    );
  }

  return true;
}

/**
 * RN-09: Valida se o número de participantes não excede a capacidade máxima do espaço.
 */
function validarCapacidadeEspaco(espaco, numeroParticipantes) {
  if (!Number.isInteger(numeroParticipantes) || numeroParticipantes < 1) {
    throw new ErroDominioReserva(
      'PARTICIPANTES_INVALIDOS',
      'O número de participantes deve ser um número inteiro maior ou igual a 1.',
      400
    );
  }

  if (numeroParticipantes > espaco.capacidade) {
    throw new ErroDominioReserva(
      'CAPACIDADE_EXCEDIDA',
      `O número de participantes informado (${numeroParticipantes}) excede a capacidade máxima do espaço (${espaco.capacidade} lugares) (RN-09).`,
      422,
      { numeroParticipantes, capacidadeMaxima: espaco.capacidade }
    );
  }

  return true;
}

/**
 * Valida campos obrigatórios do payload de criação de reserva.
 */
function validarPayloadCriacaoReserva(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new ErroDominioReserva('PAYLOAD_INVALIDO', 'Corpo da requisição ausente ou inválido.', 400);
  }

  const { espacoId, data, horarioInicio, horarioFim, numeroParticipantes, finalidade } = payload;

  if (!espacoId) {
    throw new ErroDominioReserva('CAMPO_OBRIGATORIO', 'O campo "espacoId" é obrigatório.', 400);
  }
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new ErroDominioReserva('DATA_INVALIDA', 'O campo "data" deve estar no formato YYYY-MM-DD.', 400);
  }
  if (!horarioInicio || !horarioFim) {
    throw new ErroDominioReserva('HORARIO_OBRIGATORIO', 'Os campos "horarioInicio" e "horarioFim" são obrigatórios.', 400);
  }
  if (numeroParticipantes === undefined || numeroParticipantes === null) {
    throw new ErroDominioReserva('PARTICIPANTES_OBRIGATORIO', 'O campo "numeroParticipantes" é obrigatório.', 400);
  }
  if (!finalidade || typeof finalidade !== 'string' || finalidade.trim().length < 5) {
    throw new ErroDominioReserva(
      'FINALIDADE_INVALIDA',
      'A finalidade da reserva é obrigatória e deve conter pelo menos 5 caracteres.',
      400
    );
  }

  return true;
}

/**
 * Valida o ID de uma reserva (não vazio).
 * @param {string} id
 * @returns {boolean}
 */
function validarIdReserva(id) {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new ErroDominioReserva(
      'RESERVA_ID_OBRIGATORIO',
      'O ID da reserva é obrigatório.',
      400
    );
  }
  return true;
}

/**
 * Valida o payload opcional de rejeição de reserva (motivo livre).
 * @param {object} [payload]
 * @returns {boolean}
 */
function validarPayloadRejeicaoReserva(payload) {
  if (payload === undefined || payload === null) {
    return true;
  }
  if (typeof payload !== 'object') {
    throw new ErroDominioReserva('PAYLOAD_INVALIDO', 'Corpo da requisição inválido.', 400);
  }
  const { motivo } = payload;
  if (motivo !== undefined && motivo !== null && typeof motivo !== 'string') {
    throw new ErroDominioReserva(
      'MOTIVO_INVALIDO',
      'O campo "motivo" deve ser uma string.',
      400
    );
  }
  return true;
}

/**
 * Valida o payload opcional de cancelamento de reserva (motivo livre).
 * @param {object} [payload]
 * @returns {boolean}
 */
function validarPayloadCancelamentoReserva(payload) {
  if (payload === undefined || payload === null) {
    return true;
  }
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ErroDominioReserva('PAYLOAD_INVALIDO', 'Corpo da requisição inválido.', 400);
  }
  const { motivo } = payload;
  if (motivo !== undefined && motivo !== null) {
    if (typeof motivo !== 'string') {
      throw new ErroDominioReserva(
        'MOTIVO_INVALIDO',
        'O campo "motivo" deve ser uma string.',
        400
      );
    }
    if (motivo.trim().length > 300) {
      throw new ErroDominioReserva(
        'MOTIVO_MUITO_LONGO',
        'O motivo do cancelamento deve ter no máximo 300 caracteres.',
        400
      );
    }
  }
  return true;
}

/**
 * RN-05 (P0.5): Avalia o prazo de cancelamento de uma reserva em relação à data/hora atual.
 * - Reserva já iniciada ou passada: bloqueia com 422 (PRAZO_CANCELAMENTO_EXPIRADO).
 * - Antecedência >= 2h: cancelamento sem penalidade (contabilizaCota = false).
 * - Antecedência < 2h: cancelamento permitido, porém conta como uso na cota semanal (contabilizaCota = true).
 *
 * @param {{ data: string, horarioInicio: string }} reserva
 * @param {Date|string} [dataHoraReferencia]
 * @returns {{ dentroDoPrazoSemPenalidade: boolean, contabilizaCota: boolean, horasAntecedencia: number }}
 */
function avaliarPrazoCancelamento(reserva, dataHoraReferencia = new Date()) {
  const agora = dataHoraReferencia instanceof Date
    ? dataHoraReferencia
    : new Date(dataHoraReferencia);

  if (Number.isNaN(agora.getTime())) {
    throw new ErroDominioReserva(
      'DATA_REFERENCIA_INVALIDA',
      'Data/hora de referência inválida para validação de prazo.',
      400
    );
  }

  const inicioReservaMs = Date.parse(`${reserva.data}T${reserva.horarioInicio}:00Z`);
  if (Number.isNaN(inicioReservaMs)) {
    throw new ErroDominioReserva(
      'DATA_RESERVA_INVALIDA',
      'Data ou horário de início da reserva em formato inválido.',
      400
    );
  }

  const diferencaMs = inicioReservaMs - agora.getTime();
  if (diferencaMs <= 0) {
    throw new ErroDominioReserva(
      'PRAZO_CANCELAMENTO_EXPIRADO',
      'Não é possível cancelar uma reserva que já iniciou ou está no passado (RN-05).',
      422,
      { dataReserva: reserva.data, horarioInicio: reserva.horarioInicio }
    );
  }

  const horasAntecedencia = diferencaMs / (1000 * 60 * 60);
  const prazoSemPenalidade = REGRAS_NEGOCIO.PRAZO_CANCELAMENTO_SEM_PENALIDADE_HORAS;
  const dentroDoPrazoSemPenalidade = horasAntecedencia >= prazoSemPenalidade;

  return {
    dentroDoPrazoSemPenalidade,
    contabilizaCota: !dentroDoPrazoSemPenalidade,
    horasAntecedencia: Number(horasAntecedencia.toFixed(2))
  };
}

module.exports = {
  converterHorarioParaMinutos,
  calcularDuracaoMinutos,
  intervalosConflitam,
  validarEmailInstitucional,
  validarDuracaoReserva,
  validarCapacidadeEspaco,
  validarPayloadCriacaoReserva,
  validarIdReserva,
  validarPayloadRejeicaoReserva,
  validarPayloadCancelamentoReserva,
  avaliarPrazoCancelamento
};

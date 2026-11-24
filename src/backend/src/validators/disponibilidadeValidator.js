'use strict';

const { REGRAS_NEGOCIO } = require('../config/regrasNegocio');
const { ErroDominioReserva } = require('../utils/errosDominio');
const { converterHorarioParaMinutos } = require('./reservaValidator');

const ALIASES_TIPO_ESPACO = Object.freeze({
  SALA_ESTUDO: 'SALA_ESTUDO',
  SALA_DE_ESTUDO: 'SALA_ESTUDO',
  SALA: 'SALA_ESTUDO',
  LABORATORIO: 'LABORATORIO',
  LAB: 'LABORATORIO',
  AUDITORIO: 'AUDITORIO',
  AREA_ESPORTIVA: 'AREA_ESPORTIVA',
  AREA_DE_ESPORTE: 'AREA_ESPORTIVA',
  QUADRA: 'AREA_ESPORTIVA',
  ESPORTIVA: 'AREA_ESPORTIVA',
  TODOS: null,
  TODAS: null,
  ALL: null
});

const ALIASES_TURNO = Object.freeze({
  MANHA: 'MANHA',
  MORNING: 'MANHA',
  TARDE: 'TARDE',
  AFTERNOON: 'TARDE',
  NOITE: 'NOITE',
  NIGHT: 'NOITE',
  INTEGRAL: 'INTEGRAL',
  TODOS: 'INTEGRAL',
  TODAS: 'INTEGRAL',
  ALL: 'INTEGRAL'
});

/**
 * Normaliza uma chave de enum (maiúsculas, sem acentos e com "_" no lugar de espaços/hífens).
 * @param {string} valor
 * @returns {string}
 */
function normalizarChave(valor) {
  return String(valor)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

/**
 * Formata um objeto Date em 'YYYY-MM-DD' usando o fuso local (evita deslocamento de um dia).
 * @param {Date} data
 * @returns {string}
 */
function formatarDataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Data corrente no formato 'YYYY-MM-DD' (fuso local).
 * @returns {string}
 */
function obterDataHoje() {
  return formatarDataLocal(new Date());
}

/**
 * Valida uma data no formato 'YYYY-MM-DD' e garante que exista no calendário.
 * @param {string} valor
 * @param {string} [campo]
 * @returns {string}
 */
function validarDataISO(valor, campo = 'data') {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new ErroDominioReserva(
      'DATA_INVALIDA',
      `O parâmetro "${campo}" deve estar no formato YYYY-MM-DD.`,
      400,
      { valor }
    );
  }

  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia, 12, 0, 0, 0);
  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    throw new ErroDominioReserva(
      'DATA_INVALIDA',
      `O parâmetro "${campo}" não representa uma data válida do calendário.`,
      400,
      { valor }
    );
  }

  return valor;
}

/**
 * Gera todas as datas (inclusive) entre duas datas ISO já validadas.
 * @param {string} dataInicio
 * @param {string} dataFim
 * @returns {string[]}
 */
function gerarIntervaloDatas(dataInicio, dataFim) {
  const [anoInicio, mesInicio, diaInicio] = dataInicio.split('-').map(Number);
  const [anoFim, mesFim, diaFim] = dataFim.split('-').map(Number);

  const cursor = new Date(anoInicio, mesInicio - 1, diaInicio, 12, 0, 0, 0);
  const limite = new Date(anoFim, mesFim - 1, diaFim, 12, 0, 0, 0);
  const datas = [];

  while (cursor <= limite) {
    datas.push(formatarDataLocal(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return datas;
}

/**
 * Diferença em dias entre duas datas ISO (independente de fuso/DST).
 * @param {string} dataInicio
 * @param {string} dataFim
 * @returns {number}
 */
function diferencaEmDias(dataInicio, dataFim) {
  const paraUtc = (dataISO) => {
    const [ano, mes, dia] = dataISO.split('-').map(Number);
    return Date.UTC(ano, mes - 1, dia);
  };
  return Math.round((paraUtc(dataFim) - paraUtc(dataInicio)) / 86400000);
}

/**
 * Converte minutos desde 00:00 em 'HH:MM'.
 * @param {number} minutos
 * @returns {string}
 */
function formatarMinutosParaHorario(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

/**
 * Lê um parâmetro de query string como texto não vazio.
 * Rejeita arrays (parâmetro repetido), pois a consulta usa valores únicos.
 * @param {*} valor
 * @param {string} campo
 * @returns {string|undefined}
 */
function lerTexto(valor, campo) {
  if (valor === undefined || valor === null) return undefined;
  if (typeof valor !== 'string' || Array.isArray(valor)) {
    throw new ErroDominioReserva(
      'PARAMETRO_INVALIDO',
      `O parâmetro "${campo}" deve ser informado uma única vez como texto.`,
      400
    );
  }
  const texto = valor.trim();
  return texto === '' ? undefined : texto;
}

/**
 * Resolve o filtro de tipo de espaço aceitando os enums internos e rótulos amigáveis.
 * @param {*} valor
 * @returns {string|null}
 */
function resolverTipoEspaco(valor) {
  const texto = lerTexto(valor, 'tipo');
  if (texto === undefined) return null;

  const chave = normalizarChave(texto);
  if (!(chave in ALIASES_TIPO_ESPACO)) {
    throw new ErroDominioReserva(
      'TIPO_ESPACO_INVALIDO',
      `O tipo de espaço informado não é válido. Valores aceitos: ${REGRAS_NEGOCIO.TIPOS_ESPACO.join(', ')}.`,
      400,
      { valorInformado: texto, tiposAceitos: REGRAS_NEGOCIO.TIPOS_ESPACO }
    );
  }

  return ALIASES_TIPO_ESPACO[chave];
}

/**
 * Resolve o turno informado (padrão INTEGRAL).
 * @param {*} valor
 * @returns {string}
 */
function resolverTurno(valor) {
  const texto = lerTexto(valor, 'turno');
  if (texto === undefined) return 'INTEGRAL';

  const chave = normalizarChave(texto);
  if (!(chave in ALIASES_TURNO)) {
    throw new ErroDominioReserva(
      'TURNO_INVALIDO',
      'O turno informado não é válido. Valores aceitos: MANHA, TARDE, NOITE, INTEGRAL.',
      400,
      { valorInformado: texto, turnosAceitos: Object.keys(REGRAS_NEGOCIO.TURNOS_DISPONIBILIDADE) }
    );
  }

  return ALIASES_TURNO[chave];
}

/**
 * Resolve a janela de horários da consulta.
 * Horários explícitos têm prioridade sobre o atalho de turno.
 * @param {object} query
 * @param {string} turno
 * @returns {{ horarioInicio: string, horarioFim: string, turnoAplicado: string|null }}
 */
function resolverJanelaHorarios(query, turno) {
  const inicioInformado = lerTexto(query.horarioInicio, 'horarioInicio');
  const fimInformado = lerTexto(query.horarioFim, 'horarioFim');

  if ((inicioInformado && !fimInformado) || (!inicioInformado && fimInformado)) {
    throw new ErroDominioReserva(
      'HORARIO_INCOMPLETO',
      'Informe "horarioInicio" e "horarioFim" juntos, ou use apenas o parâmetro "turno".',
      400
    );
  }

  const turnoConfig = REGRAS_NEGOCIO.TURNOS_DISPONIBILIDADE[turno];
  const horarioInicio = inicioInformado || turnoConfig.inicio;
  const horarioFim = fimInformado || turnoConfig.fim;

  const inicioMin = converterHorarioParaMinutos(horarioInicio);
  const fimMin = converterHorarioParaMinutos(horarioFim);

  if (fimMin <= inicioMin) {
    throw new ErroDominioReserva(
      'INTERVALO_HORARIO_INCOERENTE',
      'O horário final deve ser estritamente posterior ao horário inicial.',
      400,
      { horarioInicio, horarioFim }
    );
  }

  const aberturaMin = converterHorarioParaMinutos(REGRAS_NEGOCIO.HORARIO_ABERTURA_CAMPUS);
  const fechamentoMin = converterHorarioParaMinutos(REGRAS_NEGOCIO.HORARIO_FECHAMENTO_CAMPUS);
  if (inicioMin < aberturaMin || fimMin > fechamentoMin) {
    throw new ErroDominioReserva(
      'HORARIO_FORA_DO_EXPEDIENTE',
      `A consulta deve ocorrer dentro do horário de funcionamento do campus: ${REGRAS_NEGOCIO.HORARIO_ABERTURA_CAMPUS} às ${REGRAS_NEGOCIO.HORARIO_FECHAMENTO_CAMPUS}.`,
      400,
      { horarioInicio, horarioFim }
    );
  }

  const intervalo = REGRAS_NEGOCIO.INTERVALO_SLOT_DISPONIBILIDADE_MINUTOS;
  if ((inicioMin - aberturaMin) % intervalo !== 0 || (fimMin - aberturaMin) % intervalo !== 0) {
    throw new ErroDominioReserva(
      'HORARIO_FORA_DA_GRADE',
      `Os horários devem estar alinhados à grade de ${intervalo} minutos (ex.: 07:00, 07:30, 08:00).`,
      400,
      { horarioInicio, horarioFim, intervaloSlotMinutos: intervalo }
    );
  }

  return {
    horarioInicio,
    horarioFim,
    turnoAplicado: inicioInformado ? null : turno
  };
}

/**
 * Valida e normaliza os parâmetros da consulta de disponibilidade (T5.1 / CU-02).
 *
 * Aceita:
 * - `data` (um dia) ou `dataInicio` + `dataFim` (até 7 dias);
 * - sem data => considera a data corrente;
 * - `espacoId`, `tipo`, `capacidadeMinima`, `localizacao`/`predio`;
 * - `turno` ou `horarioInicio` + `horarioFim`.
 *
 * @param {object} query - Parâmetros da query string
 * @returns {object} Filtros normalizados, incluindo o array `datas`
 */
function validarConsultaDisponibilidade(query) {
  if (query === null || typeof query !== 'object' || Array.isArray(query)) {
    throw new ErroDominioReserva('PARAMETROS_INVALIDOS', 'Parâmetros de consulta inválidos.', 400);
  }

  const data = lerTexto(query.data, 'data');
  const dataInicioInformada = lerTexto(query.dataInicio, 'dataInicio');
  const dataFimInformada = lerTexto(query.dataFim, 'dataFim');

  if (data && (dataInicioInformada || dataFimInformada)) {
    throw new ErroDominioReserva(
      'PARAMETROS_DATA_CONFLITANTES',
      'Informe "data" para um único dia ou "dataInicio" e "dataFim" para um período, mas não ambos.',
      400
    );
  }

  const hoje = obterDataHoje();
  let dataInicio;
  let dataFim;

  if (data) {
    validarDataISO(data, 'data');
    dataInicio = data;
    dataFim = data;
  } else if (dataInicioInformada || dataFimInformada) {
    if (!dataInicioInformada || !dataFimInformada) {
      throw new ErroDominioReserva(
        'PERIODO_DATAS_OBRIGATORIO',
        'Informe "dataInicio" e "dataFim" juntos para consultar um período.',
        400
      );
    }
    validarDataISO(dataInicioInformada, 'dataInicio');
    validarDataISO(dataFimInformada, 'dataFim');
    if (dataFimInformada < dataInicioInformada) {
      throw new ErroDominioReserva(
        'PERIODO_DATAS_INVALIDO',
        'A "dataFim" deve ser igual ou posterior à "dataInicio".',
        400,
        { dataInicio: dataInicioInformada, dataFim: dataFimInformada }
      );
    }
    const totalDias = diferencaEmDias(dataInicioInformada, dataFimInformada) + 1;
    if (totalDias > REGRAS_NEGOCIO.MAX_DIAS_CONSULTA_DISPONIBILIDADE) {
      throw new ErroDominioReserva(
        'PERIODO_DATAS_EXCEDIDO',
        `O período de consulta não pode exceder ${REGRAS_NEGOCIO.MAX_DIAS_CONSULTA_DISPONIBILIDADE} dias.`,
        400,
        { totalDiasSolicitados: totalDias, maxDias: REGRAS_NEGOCIO.MAX_DIAS_CONSULTA_DISPONIBILIDADE }
      );
    }
    dataInicio = dataInicioInformada;
    dataFim = dataFimInformada;
  } else {
    dataInicio = hoje;
    dataFim = hoje;
  }

  if (dataInicio < hoje) {
    throw new ErroDominioReserva(
      'DATA_NO_PASSADO',
      'A data da consulta não pode ser anterior ao dia atual.',
      400,
      { dataInformada: dataInicio, dataAtual: hoje }
    );
  }

  const espacoId = lerTexto(query.espacoId, 'espacoId');
  const tipo = resolverTipoEspaco(query.tipo);
  const turno = resolverTurno(query.turno);
  const { horarioInicio, horarioFim, turnoAplicado } = resolverJanelaHorarios(query, turno);

  const capacidadeBruta = lerTexto(query.capacidadeMinima, 'capacidadeMinima');
  let capacidadeMinima = null;
  if (capacidadeBruta !== undefined) {
    if (!/^\d+$/.test(capacidadeBruta)) {
      throw new ErroDominioReserva(
        'CAPACIDADE_MINIMA_INVALIDA',
        'O parâmetro "capacidadeMinima" deve ser um número inteiro maior ou igual a 1.',
        400,
        { valorInformado: capacidadeBruta }
      );
    }
    capacidadeMinima = Number(capacidadeBruta);
    if (!Number.isInteger(capacidadeMinima) || capacidadeMinima < 1) {
      throw new ErroDominioReserva(
        'CAPACIDADE_MINIMA_INVALIDA',
        'O parâmetro "capacidadeMinima" deve ser um número inteiro maior ou igual a 1.',
        400,
        { valorInformado: capacidadeBruta }
      );
    }
  }

  const localizacao =
    lerTexto(query.localizacao, 'localizacao') || lerTexto(query.predio, 'predio');

  return {
    datas: gerarIntervaloDatas(dataInicio, dataFim),
    dataInicio,
    dataFim,
    espacoId: espacoId || null,
    tipo,
    capacidadeMinima,
    localizacao: localizacao || null,
    turno: turnoAplicado,
    horarioInicio,
    horarioFim
  };
}

module.exports = {
  normalizarChave,
  formatarDataLocal,
  obterDataHoje,
  validarDataISO,
  gerarIntervaloDatas,
  diferencaEmDias,
  formatarMinutosParaHorario,
  validarConsultaDisponibilidade
};

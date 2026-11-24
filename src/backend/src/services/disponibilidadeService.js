'use strict';

const { REGRAS_NEGOCIO } = require('../config/regrasNegocio');
const { ErroDominioReserva } = require('../utils/errosDominio');
const { converterHorarioParaMinutos, intervalosConflitam } = require('../validators/reservaValidator');
const { formatarMinutosParaHorario } = require('../validators/disponibilidadeValidator');

const DIAS_SEMANA = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];

/**
 * Serviço de consulta da agenda única de disponibilidade (T5.1 / CU-02).
 * Cruza espaços ativos, reservas CONFIRMADAS (RN-01) e bloqueios ATIVOS (RN-06)
 * para montar slots de 30 minutos entre 07:00 e 22:00.
 */
class DisponibilidadeService {
  /**
   * @param {import('../repositories/disponibilidadeRepository').DisponibilidadeRepository} disponibilidadeRepository
   */
  constructor(disponibilidadeRepository) {
    this.disponibilidadeRepository = disponibilidadeRepository;
  }

  /**
   * Consulta a disponibilidade de um espaço específico ou de todos os espaços ativos.
   *
   * @param {object} filtros - Resultado de `validarConsultaDisponibilidade`
   * @param {string[]} filtros.datas - Datas ISO já validadas
   * @param {string} filtros.horarioInicio - 'HH:MM'
   * @param {string} filtros.horarioFim - 'HH:MM'
   * @param {string|null} [filtros.espacoId]
   * @param {string|null} [filtros.tipo]
   * @param {number|null} [filtros.capacidadeMinima]
   * @param {string|null} [filtros.localizacao]
   * @returns {object} Agenda com slots LIVRE, OCUPADO e BLOQUEADO
   */
  consultarDisponibilidade(filtros) {
    const { datas, horarioInicio, horarioFim, espacoId, tipo, capacidadeMinima, localizacao } =
      filtros;

    let espacos;

    if (espacoId) {
      const espaco = this.disponibilidadeRepository.buscarEspacoPorId(espacoId);
      if (!espaco) {
        throw new ErroDominioReserva(
          'ESPACO_NAO_ENCONTRADO',
          'O espaço físico solicitado não foi encontrado no catálogo.',
          404,
          { espacoId }
        );
      }
      if (!espaco.ativo) {
        throw new ErroDominioReserva(
          'ESPACO_INATIVO',
          'Este espaço encontra-se desativado e não está disponível para consulta de reserva (RN-12).',
          404,
          { espacoId }
        );
      }
      espacos = [espaco];
    } else {
      espacos = this.disponibilidadeRepository.listarEspacosAtivos();
    }

    espacos = this._aplicarFiltrosFisicos(espacos, {
      tipo,
      capacidadeMinima,
      localizacao
    }).sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));

    const agendas = espacos.map((espaco) =>
      this._montarAgendaEspaco(espaco, datas, horarioInicio, horarioFim)
    );

    const totalSlotsLivres = agendas.reduce(
      (acumulado, agenda) => acumulado + agenda.resumo.livres,
      0
    );

    return {
      periodo: {
        dataInicio: datas[0],
        dataFim: datas[datas.length - 1],
        totalDias: datas.length,
        horarioInicio,
        horarioFim,
        intervaloSlotMinutos: REGRAS_NEGOCIO.INTERVALO_SLOT_DISPONIBILIDADE_MINUTOS
      },
      filtros: {
        espacoId: espacoId || null,
        tipo: tipo || null,
        capacidadeMinima: capacidadeMinima ?? null,
        localizacao: localizacao || null,
        turno: filtros.turno
      },
      totalEspacos: agendas.length,
      totalSlotsLivres,
      espacos: agendas
    };
  }

  /**
   * Aplica os filtros físicos do CU-02 sobre os espaços candidatos.
   * @param {Array<object>} espacos
   * @param {{ tipo: string|null, capacidadeMinima: number|null, localizacao: string|null }} filtros
   * @returns {Array<object>}
   * @private
   */
  _aplicarFiltrosFisicos(espacos, { tipo, capacidadeMinima, localizacao }) {
    const localizacaoNormalizada = localizacao
      ? this._normalizarTexto(localizacao)
      : null;

    return espacos.filter((espaco) => {
      if (tipo && espaco.tipo !== tipo) return false;
      if (capacidadeMinima && Number(espaco.capacidade) < capacidadeMinima) return false;
      if (localizacaoNormalizada) {
        const textoEspaco = this._normalizarTexto(
          `${espaco.nome || ''} ${espaco.predio || ''} ${espaco.localizacao || ''}`
        );
        if (!textoEspaco.includes(localizacaoNormalizada)) return false;
      }
      return true;
    });
  }

  /**
   * Monta a agenda de um espaço para todas as datas solicitadas.
   * @param {object} espaco
   * @param {string[]} datas
   * @param {string} horarioInicio
   * @param {string} horarioFim
   * @returns {object}
   * @private
   */
  _montarAgendaEspaco(espaco, datas, horarioInicio, horarioFim) {
    const dias = datas.map((data) => {
      const reservas = this.disponibilidadeRepository.listarReservasConfirmadasEspacoData(
        espaco.id,
        data
      );
      const bloqueios = this.disponibilidadeRepository.listarBloqueiosAtivosEspacoData(
        espaco.id,
        data
      );

      const slots = this._gerarSlots(horarioInicio, horarioFim).map((slot) =>
        this._classificarSlot(slot, reservas, bloqueios)
      );

      const resumo = this._resumirSlots(slots);

      return {
        data,
        diaSemana: this._obterDiaSemana(data),
        slots,
        resumo,
        totalmenteLivre: resumo.livres === resumo.totalSlots
      };
    });

    const resumo = dias.reduce(
      (acumulado, dia) => ({
        totalSlots: acumulado.totalSlots + dia.resumo.totalSlots,
        livres: acumulado.livres + dia.resumo.livres,
        ocupados: acumulado.ocupados + dia.resumo.ocupados,
        bloqueados: acumulado.bloqueados + dia.resumo.bloqueados
      }),
      { totalSlots: 0, livres: 0, ocupados: 0, bloqueados: 0 }
    );

    return {
      espacoId: espaco.id,
      codigo: espaco.codigo,
      nome: espaco.nome,
      tipo: espaco.tipo,
      capacidade: espaco.capacidade,
      localizacao: espaco.localizacao,
      predio: espaco.predio || null,
      dias,
      resumo,
      disponivelNoPeriodo: resumo.livres > 0
    };
  }

  /**
   * Gera a grade de slots de um dia.
   * @param {string} horarioInicio
   * @param {string} horarioFim
   * @returns {Array<{ horarioInicio: string, horarioFim: string }>}
   * @private
   */
  _gerarSlots(horarioInicio, horarioFim) {
    const inicioMinutos = converterHorarioParaMinutos(horarioInicio);
    const fimMinutos = converterHorarioParaMinutos(horarioFim);
    const intervalo = REGRAS_NEGOCIO.INTERVALO_SLOT_DISPONIBILIDADE_MINUTOS;
    const slots = [];

    for (let atual = inicioMinutos; atual + intervalo <= fimMinutos; atual += intervalo) {
      slots.push({
        horarioInicio: formatarMinutosParaHorario(atual),
        horarioFim: formatarMinutosParaHorario(atual + intervalo)
      });
    }

    return slots;
  }

  /**
   * Classifica um slot: BLOQUEADO (RN-06) tem prioridade sobre OCUPADO (RN-01).
   * @param {{ horarioInicio: string, horarioFim: string }} slot
   * @param {Array<object>} reservas
   * @param {Array<object>} bloqueios
   * @returns {object}
   * @private
   */
  _classificarSlot(slot, reservas, bloqueios) {
    const bloqueio = bloqueios.find((b) =>
      intervalosConflitam(slot.horarioInicio, slot.horarioFim, b.horarioInicio, b.horarioFim)
    );

    if (bloqueio) {
      return {
        ...slot,
        status: 'BLOQUEADO',
        bloqueioId: bloqueio.id,
        motivo: bloqueio.motivo
      };
    }

    const reserva = reservas.find((r) =>
      intervalosConflitam(slot.horarioInicio, slot.horarioFim, r.horarioInicio, r.horarioFim)
    );

    if (reserva) {
      return {
        ...slot,
        status: 'OCUPADO',
        reservaId: reserva.id
      };
    }

    return { ...slot, status: 'LIVRE' };
  }

  /**
   * @param {Array<object>} slots
   * @returns {{ totalSlots: number, livres: number, ocupados: number, bloqueados: number }}
   * @private
   */
  _resumirSlots(slots) {
    return slots.reduce(
      (resumo, slot) => {
        resumo.totalSlots += 1;
        if (slot.status === 'LIVRE') resumo.livres += 1;
        if (slot.status === 'OCUPADO') resumo.ocupados += 1;
        if (slot.status === 'BLOQUEADO') resumo.bloqueados += 1;
        return resumo;
      },
      { totalSlots: 0, livres: 0, ocupados: 0, bloqueados: 0 }
    );
  }

  /**
   * @param {string} data - 'YYYY-MM-DD'
   * @returns {string} Dia da semana em português, sem acento
   * @private
   */
  _obterDiaSemana(data) {
    const [ano, mes, dia] = data.split('-').map(Number);
    return DIAS_SEMANA[new Date(ano, mes - 1, dia, 12).getDay()];
  }

  /**
   * @param {string} texto
   * @returns {string}
   * @private
   */
  _normalizarTexto(texto) {
    return String(texto)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}

module.exports = { DisponibilidadeService };

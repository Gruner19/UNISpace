'use strict';

const crypto = require('node:crypto');
const { REGRAS_NEGOCIO } = require('../config/regrasNegocio');
const { ErroDominioReserva } = require('../utils/errosDominio');
const { intervalosConflitam } = require('../validators/reservaValidator');

/**
 * Converte uma data (Date ou 'YYYY-MM-DD') para a segunda-feira ('YYYY-MM-DD') da sua semana ISO.
 * @param {Date|string} dataReferencia
 * @returns {string}
 */
function obterInicioSemanaISO(dataReferencia = new Date()) {
  const dataObj =
    dataReferencia instanceof Date
      ? new Date(Date.UTC(dataReferencia.getUTCFullYear(), dataReferencia.getUTCMonth(), dataReferencia.getUTCDate()))
      : /^\d{4}-\d{2}-\d{2}$/.test(dataReferencia)
        ? new Date(`${dataReferencia}T00:00:00Z`)
        : new Date(dataReferencia);

  if (Number.isNaN(dataObj.getTime())) {
    throw new ErroDominioReserva(
      'DATA_SEMANA_INVALIDA',
      'Data de referência inválida para cálculo de prioridade rotativa.',
      400
    );
  }

  const diaSemana = dataObj.getUTCDay(); // 0 = domingo, 1 = segunda, ...
  const deslocamentoParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segunda = new Date(
    Date.UTC(
      dataObj.getUTCFullYear(),
      dataObj.getUTCMonth(),
      dataObj.getUTCDate() + deslocamentoParaSegunda
    )
  );
  return segunda.toISOString().slice(0, 10);
}

/**
 * Soma (ou subtrai) dias em uma string 'YYYY-MM-DD' de forma segura em UTC.
 * @param {string} dataISO
 * @param {number} dias
 * @returns {string}
 */
function somarDiasISO(dataISO, dias) {
  const base = new Date(`${dataISO}T00:00:00Z`);
  const resultado = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + dias)
  );
  return resultado.toISOString().slice(0, 10);
}

class PrioridadeService {
  /**
   * @param {import('../repositories/prioridadeRepository').PrioridadeRepository} prioridadeRepository
   * @param {import('../repositories/reservaRepository').ReservaRepository} reservaRepository
   */
  constructor(prioridadeRepository, reservaRepository) {
    this.prioridadeRepository = prioridadeRepository;
    this.reservaRepository = reservaRepository;
  }

  /**
   * RN-04 (P0.5 / P2.2): Calcula e persiste o curso com prioridade rotativa para um espaço
   * em determinada semana, com base no menor uso de horas na semana anterior.
   * Empates são resolvidos por sorteio registrado na trilha de auditoria (RN-13).
   *
   * @param {string} espacoId
   * @param {string|Date} [semanaReferencia]
   * @param {object} [opcoes]
   * @returns {object}
   */
  calcularPrioridadeSemanal(espacoId, semanaReferencia = new Date(), opcoes = {}) {
    const espaco = this.reservaRepository.espacos.get(espacoId);
    if (!espaco) {
      throw new ErroDominioReserva(
        'ESPACO_NAO_ENCONTRADO',
        'O espaço físico informado não foi encontrado.',
        404
      );
    }

    const cursos = this.prioridadeRepository.listarCursos();
    if (cursos.length === 0) {
      throw new ErroDominioReserva(
        'CURSOS_NAO_CADASTRADOS',
        'Não há cursos cadastrados para calcular a prioridade rotativa (RN-04).',
        422
      );
    }

    const semanaISO = obterInicioSemanaISO(semanaReferencia);
    const semanaAnteriorInicio = somarDiasISO(semanaISO, -7);
    const semanaAnteriorFim = somarDiasISO(semanaISO, -1);

    // Soma minutos utilizados por cada curso na semana anterior neste espaço
    const minutosPorCurso = new Map(cursos.map((c) => [c.id, 0]));

    for (const reserva of this.reservaRepository.reservas.values()) {
      if (reserva.espacoId !== espacoId) continue;
      if (reserva.status !== 'CONFIRMADA' && reserva.status !== 'CONCLUIDA') continue;
      if (reserva.data < semanaAnteriorInicio || reserva.data > semanaAnteriorFim) continue;

      const usuario = this.reservaRepository.usuarios.get(reserva.usuarioId);
      const cursoId = reserva.cursoId || usuario?.cursoId;
      if (cursoId && minutosPorCurso.has(cursoId)) {
        minutosPorCurso.set(cursoId, minutosPorCurso.get(cursoId) + (reserva.duracaoMinutos || 0));
      }
    }

    const rankingSemanaAnterior = cursos
      .map((curso) => ({
        cursoId: curso.id,
        codigo: curso.codigo,
        nome: curso.nome,
        faculdade: curso.faculdade,
        horasUtilizadas: Number(((minutosPorCurso.get(curso.id) || 0) / 60).toFixed(2))
      }))
      .sort((a, b) => a.horasUtilizadas - b.horasUtilizadas || a.codigo.localeCompare(b.codigo));

    const menorUsoHoras = rankingSemanaAnterior[0].horasUtilizadas;
    const empatados = rankingSemanaAnterior.filter((c) => c.horasUtilizadas === menorUsoHoras);

    let desempatePorSorteio = false;
    let vencedor = empatados[0];

    if (empatados.length > 1) {
      desempatePorSorteio = true;
      const sortearIndice =
        typeof opcoes.sortearIndice === 'function'
          ? opcoes.sortearIndice
          : (tamanho) => crypto.randomInt(0, tamanho);
      const indiceSorteado = sortearIndice(empatados.length);
      vencedor = empatados[Math.max(0, Math.min(indiceSorteado, empatados.length - 1))];
    }

    const aberturaDate = opcoes.aberturaAgendaEm
      ? new Date(opcoes.aberturaAgendaEm)
      : new Date(`${semanaISO}T00:00:00.000Z`);

    if (Number.isNaN(aberturaDate.getTime())) {
      throw new ErroDominioReserva(
        'DATA_ABERTURA_INVALIDA',
        'A data/hora de abertura da agenda é inválida.',
        400
      );
    }

    const duracaoJanelaMs = REGRAS_NEGOCIO.JANELA_EXCLUSIVA_PRIORIDADE_HORAS * 60 * 60 * 1000;
    const janelaExclusivaInicio = aberturaDate.toISOString();
    const janelaExclusivaFim = new Date(aberturaDate.getTime() + duracaoJanelaMs).toISOString();

    const prioridadeSalva = this.prioridadeRepository.salvarPrioridade({
      espacoId,
      semanaReferencia: semanaISO,
      cursoPrioritarioId: vencedor.cursoId,
      horasUsadasSemanaAnterior: menorUsoHoras,
      janelaExclusivaInicio,
      janelaExclusivaFim,
      desempatePorSorteio,
      rankingSemanaAnterior
    });

    // RN-04 & RN-13: Empates resolvidos por sorteio devem ser registrados em auditoria
    if (desempatePorSorteio) {
      this.reservaRepository.auditoria.push({
        id: crypto.randomUUID(),
        reservaId: null,
        bloqueioId: null,
        usuarioId: opcoes.usuarioExecutorId || 'sistema-equidade',
        acao: 'SORTEIO_PRIORIDADE',
        statusAnterior: null,
        statusNovo: vencedor.cursoId,
        ipSolicitante: opcoes.ipSolicitante || '127.0.0.1',
        dataHora: new Date().toISOString(),
        detalhes: {
          espacoId,
          semanaReferencia: semanaISO,
          menorUsoHoras,
          cursosEmpatados: empatados.map((c) => c.cursoId),
          cursoVencedorId: vencedor.cursoId,
          cursoVencedorNome: vencedor.nome
        }
      });
    }

    return this._formatarRespostaPrioridade(prioridadeSalva, espaco, opcoes.dataHoraReferencia || new Date());
  }

  /**
   * Consulta o grupo/curso com prioridade atual (para um espaço específico ou todos os espaços ativos).
   * @param {{ espacoId?: string, semana?: string }} [filtros]
   * @param {Date|string} [dataHoraReferencia]
   */
  obterPrioridadeAtual(filtros = {}, dataHoraReferencia = new Date()) {
    const agora =
      dataHoraReferencia instanceof Date ? dataHoraReferencia : new Date(dataHoraReferencia);
    const semanaISO = filtros.semana
      ? obterInicioSemanaISO(filtros.semana)
      : obterInicioSemanaISO(agora);

    const espacosAlvo = filtros.espacoId
      ? [this.reservaRepository.espacos.get(filtros.espacoId)].filter(Boolean)
      : Array.from(this.reservaRepository.espacos.values()).filter((e) => e.ativo);

    if (filtros.espacoId && espacosAlvo.length === 0) {
      throw new ErroDominioReserva(
        'ESPACO_NAO_ENCONTRADO',
        'O espaço físico solicitado não foi encontrado.',
        404
      );
    }

    const prioridades = [];
    for (const espaco of espacosAlvo) {
      let registro = this.prioridadeRepository.buscarPrioridade(espaco.id, semanaISO);
      if (!registro && this.prioridadeRepository.listarCursos().length > 0) {
        const calculada = this.calcularPrioridadeSemanal(espaco.id, semanaISO, {
          dataHoraReferencia: agora
        });
        prioridades.push(calculada);
        continue;
      }
      if (registro) {
        prioridades.push(this._formatarRespostaPrioridade(registro, espaco, agora));
      }
    }

    return {
      semanaReferencia: semanaISO,
      consultadoEm: agora.toISOString(),
      prioridades
    };
  }

  /**
   * RN-04: Valida se o usuário pode reservar o espaço no horário solicitado considerando
   * a janela exclusiva de 24h para horário nobre.
   * Chamado dentro de ReservaService.criarReservaAtomica().
   */
  validarAcessoPrioritario({
    espaco,
    data,
    horarioInicio,
    horarioFim,
    contextoUsuario,
    agora = new Date()
  }) {
    // Administradores não sofrem bloqueio da janela de prioridade estudantil
    if (contextoUsuario?.perfil === 'ADMINISTRADOR') {
      return true;
    }

    const semanaISO = obterInicioSemanaISO(data);
    const prioridade = this.prioridadeRepository.buscarPrioridade(espaco.id, semanaISO);
    if (!prioridade) {
      return true;
    }

    const agoraMs = (agora instanceof Date ? agora : new Date(agora)).getTime();
    const janelaInicioMs = Date.parse(prioridade.janelaExclusivaInicio);
    const janelaFimMs = Date.parse(prioridade.janelaExclusivaFim);

    const estaNaJanelaExclusiva = agoraMs >= janelaInicioMs && agoraMs < janelaFimMs;
    if (!estaNaJanelaExclusiva) {
      return true;
    }

    const horarioNobreInicio =
      espaco.horarioNobreInicio || REGRAS_NEGOCIO.HORARIO_NOBRE_PADRAO.inicio;
    const horarioNobreFim = espaco.horarioNobreFim || REGRAS_NEGOCIO.HORARIO_NOBRE_PADRAO.fim;

    const ehHorarioNobre = intervalosConflitam(
      horarioInicio,
      horarioFim,
      horarioNobreInicio,
      horarioNobreFim
    );
    if (!ehHorarioNobre) {
      return true;
    }

    const usuarioPersistido = this.reservaRepository.usuarios.get(contextoUsuario?.id);
    const cursoIdUsuario = contextoUsuario?.cursoId || usuarioPersistido?.cursoId || null;

    if (cursoIdUsuario !== prioridade.cursoPrioritarioId) {
      const cursoPrioritario = this.prioridadeRepository.buscarCursoPorId(
        prioridade.cursoPrioritarioId
      );
      const nomeCurso = cursoPrioritario ? cursoPrioritario.nome : prioridade.cursoPrioritarioId;

      throw new ErroDominioReserva(
        'PRIORIDADE_ROTATIVA_ATIVA',
        `Este espaço está na janela exclusiva de 24h para horário nobre (${horarioNobreInicio}–${horarioNobreFim}) reservada ao curso prioritário "${nomeCurso}" (RN-04).`,
        403,
        {
          espacoId: espaco.id,
          semanaReferencia: semanaISO,
          cursoPrioritarioId: prioridade.cursoPrioritarioId,
          cursoPrioritarioNome: nomeCurso,
          cursoUsuarioId: cursoIdUsuario,
          janelaExclusivaFim: prioridade.janelaExclusivaFim,
          horarioNobre: { inicio: horarioNobreInicio, fim: horarioNobreFim }
        }
      );
    }

    return true;
  }

  _formatarRespostaPrioridade(registro, espaco, agoraRef) {
    const agoraMs = (agoraRef instanceof Date ? agoraRef : new Date(agoraRef)).getTime();
    const inicioMs = Date.parse(registro.janelaExclusivaInicio);
    const fimMs = Date.parse(registro.janelaExclusivaFim);
    const cursoPrioritario = this.prioridadeRepository.buscarCursoPorId(
      registro.cursoPrioritarioId
    );

    return {
      id: registro.id,
      espacoId: espaco.id,
      espacoNome: espaco.nome,
      semanaReferencia: registro.semanaReferencia,
      cursoPrioritario: cursoPrioritario || { id: registro.cursoPrioritarioId },
      horasUsadasSemanaAnterior: registro.horasUsadasSemanaAnterior,
      desempatePorSorteio: Boolean(registro.desempatePorSorteio),
      janelaExclusivaInicio: registro.janelaExclusivaInicio,
      janelaExclusivaFim: registro.janelaExclusivaFim,
      janelaExclusivaAtiva: agoraMs >= inicioMs && agoraMs < fimMs,
      horarioNobre: {
        inicio: espaco.horarioNobreInicio || REGRAS_NEGOCIO.HORARIO_NOBRE_PADRAO.inicio,
        fim: espaco.horarioNobreFim || REGRAS_NEGOCIO.HORARIO_NOBRE_PADRAO.fim
      },
      rankingSemanaAnterior: registro.rankingSemanaAnterior || []
    };
  }
}

module.exports = {
  PrioridadeService,
  obterInicioSemanaISO,
  somarDiasISO
};

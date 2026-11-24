'use strict';

const crypto = require('node:crypto');

/**
 * Registra uma notificação destinada ao solicitante de uma reserva.
 * Implementação em memória e sem dependências externas (conforme o stack atual do UNISpace):
 * - grava na fila `repository.notificacoes` para inspeção em testes e consumo pelo frontend (T9.2);
 * - imprime um log visível no console do servidor (substituto do envio real de e-mail até que um serviço de notificação seja adotado).
 *
 * @param {object} repository - Instância do repositório (exibe `registrarNotificacao` e `notificacoes`).
 * @param {object} dados - { usuarioId, reservaId, tipo, assunto, corpo, ipSolicitante? }
 * @returns {object} Notificação registrada
 */
function registrarNotificacao(repository, dados) {
  const { usuarioId, reservaId, tipo, assunto, corpo, ipSolicitante } = dados || {};

  if (!usuarioId || !reservaId || !tipo || !assunto || !corpo) {
    throw new Error('NOTIFICACAO_INVALIDA: usuarioId, reservaId, tipo, assunto e corpo são obrigatórios.');
  }

  const notificacao = {
    id: crypto.randomUUID(),
    usuarioId,
    reservaId,
    tipo,
    assunto,
    corpo,
    ipSolicitante: ipSolicitante || '127.0.0.1',
    enviada: false,
    criadoEm: new Date().toISOString()
  };

  if (repository && typeof repository.registrarNotificacao === 'function') {
    repository.registrarNotificacao(notificacao);
  }

  console.log(
    `[NOTIFICACAO] tipo=${tipo} usuarioId=${usuarioId} reservaId=${reservaId} `
    + `assunto="${assunto}" ip=${notificacao.ipSolicitante}`
  );

  return { ...notificacao };
}

module.exports = { registrarNotificacao };

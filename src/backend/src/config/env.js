'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Carrega um arquivo .env simples (KEY=VALUE) sem dependências externas.
 * Valores já definidos no ambiente têm prioridade.
 * @param {string} caminho
 */
function carregarArquivoEnv(caminho) {
  if (!fs.existsSync(caminho)) {
    return;
  }

  const conteudo = fs.readFileSync(caminho, 'utf8');

  for (const linha of conteudo.split(/\r?\n/)) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith('#')) {
      continue;
    }

    const separador = limpa.indexOf('=');
    if (separador === -1) {
      continue;
    }

    const chave = limpa.slice(0, separador).trim();
    let valor = limpa.slice(separador + 1).trim();

    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    if (chave && !(chave in process.env)) {
      process.env[chave] = valor;
    }
  }
}

carregarArquivoEnv(path.resolve(__dirname, '..', '..', '.env'));

const config = Object.freeze({
  host: process.env.HOST || '0.0.0.0',
  porta: Number.parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d'
});

module.exports = { config, carregarArquivoEnv };

'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '..');
const diretorios = ['src', 'tests'];
const arquivos = [];

function coletarArquivosJavaScript(diretorio) {
  for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
    const caminho = path.join(diretorio, entrada.name);
    if (entrada.isDirectory()) {
      coletarArquivosJavaScript(caminho);
    } else if (entrada.name.endsWith('.js')) {
      arquivos.push(caminho);
    }
  }
}

for (const diretorio of diretorios) {
  const caminho = path.join(raiz, diretorio);
  if (fs.existsSync(caminho)) {
    coletarArquivosJavaScript(caminho);
  }
}

for (const arquivo of arquivos) {
  execFileSync(process.execPath, ['--check', arquivo], { stdio: 'inherit' });
}

console.log(`Sintaxe JavaScript validada em ${arquivos.length} arquivo(s).`);

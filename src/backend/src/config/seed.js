'use strict';

/**
 * Dados iniciais do modo de execução local.
 * O repositório atual é em memória; estes registros permitem testar a API
 * sem depender do PostgreSQL (migrações em src/database).
 */
const SEED_PADRAO = {
  espacos: [
    {
      id: 'espaco-lab-01',
      codigo: 'LAB-204',
      nome: 'Laboratório de Engenharia de Software',
      tipo: 'LABORATORIO',
      capacidade: 30,
      localizacao: 'ICEB III - Sala 204',
      predio: 'ICEB III',
      duracaoMinimaMinutos: 30,
      duracaoMaximaMinutos: 180,
      blocoMinutos: 30,
      ativo: true
    },
    {
      id: 'espaco-sala-01',
      codigo: 'SALA-101',
      nome: 'Sala de Estudo da Biblioteca',
      tipo: 'SALA_ESTUDO',
      capacidade: 12,
      localizacao: 'Biblioteca Central - Sala 101',
      predio: 'Biblioteca Central',
      duracaoMinimaMinutos: 30,
      duracaoMaximaMinutos: 120,
      blocoMinutos: 30,
      ativo: true
    },
    {
      id: 'espaco-aud-01',
      codigo: 'AUD-01',
      nome: 'Auditório Principal',
      tipo: 'AUDITORIO',
      capacidade: 120,
      localizacao: 'Prédio Central - Térreo',
      predio: 'Prédio Central',
      duracaoMinimaMinutos: 60,
      duracaoMaximaMinutos: 240,
      blocoMinutos: 60,
      ativo: true
    },
    {
      id: 'espaco-quadra-01',
      codigo: 'QUADRA-01',
      nome: 'Quadra Poliesportiva',
      tipo: 'AREA_ESPORTIVA',
      capacidade: 40,
      localizacao: 'Complexo Esportivo',
      predio: 'Complexo Esportivo',
      duracaoMinimaMinutos: 60,
      duracaoMaximaMinutos: 120,
      blocoMinutos: 60,
      ativo: true
    }
  ],
  usuarios: [
    {
      id: 'user-demo-1',
      nome: 'Estudante Demonstração',
      emailInstitucional: 'demo@aluno.ufop.edu.br',
      perfil: 'ESTUDANTE'
    },
    {
      id: 'user-admin-1',
      nome: 'Administrador UNISpace',
      emailInstitucional: 'admin@ufop.edu.br',
      perfil: 'ADMINISTRADOR'
    }
  ],
  reservas: [],
  bloqueios: []
};

module.exports = { SEED_PADRAO };

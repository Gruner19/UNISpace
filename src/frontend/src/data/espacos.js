export const espacos = [
  {
    id: 'espaco-lab-01',
    codigo: 'LAB-204',
    nome: 'Laboratório de Engenharia de Software',
    tipo: 'LABORATORIO',
    capacidade: 30,
    localizacao: 'ICEB III · Sala 204',
    descricao: 'Bancadas amplas e estrutura ideal para projetos em equipe.',
    destaque: 'Para projetos',
    cor: 'violet',
    icone: '⌘'
  },
  {
    id: 'espaco-sala-01',
    codigo: 'SALA-101',
    nome: 'Sala de Estudo da Biblioteca',
    tipo: 'SALA_ESTUDO',
    capacidade: 12,
    localizacao: 'Biblioteca Central · Sala 101',
    descricao: 'Um ambiente tranquilo para estudar ou trabalhar em grupo.',
    destaque: 'Silencioso',
    cor: 'blue',
    icone: '▤'
  },
  {
    id: 'espaco-aud-01',
    codigo: 'AUD-01',
    nome: 'Auditório Principal',
    tipo: 'AUDITORIO',
    capacidade: 120,
    localizacao: 'Prédio Central · Térreo',
    descricao: 'Espaço amplo para apresentações, palestras e encontros.',
    destaque: 'Grande capacidade',
    cor: 'orange',
    icone: '▥'
  },
  {
    id: 'espaco-quadra-01',
    codigo: 'QUADRA-01',
    nome: 'Quadra Poliesportiva',
    tipo: 'AREA_ESPORTIVA',
    capacidade: 40,
    localizacao: 'Complexo Esportivo',
    descricao: 'Estrutura para atividades esportivas e eventos ao ar livre.',
    destaque: 'Esportes',
    cor: 'green',
    icone: '◉'
  }
];

export const tiposEspaco = [
  { valor: 'TODOS', rotulo: 'Todos os espaços' },
  { valor: 'SALA_ESTUDO', rotulo: 'Sala de estudo' },
  { valor: 'LABORATORIO', rotulo: 'Laboratório' },
  { valor: 'AUDITORIO', rotulo: 'Auditório' },
  { valor: 'AREA_ESPORTIVA', rotulo: 'Área esportiva' }
];

export function rotuloTipo(tipo) {
  return tiposEspaco.find((item) => item.valor === tipo)?.rotulo ?? tipo;
}

// Conteúdo padrão do site. Tudo aqui pode ser sobrescrito pelo painel /admin (Supabase).
// Se o Supabase ainda não estiver configurado, o site funciona só com estes dados.

export const DEFAULT_SITE = {
  hero_titulo: 'Aqui você tem uma família.',
  hero_subtitulo:
    'Somos a Igreja Batista Nacional em Rondonópolis. Venha como você está — tem um lugar pra você.',
  missao: 'Amar as pessoas e conduzi-las a Cristo, servindo com testemunho e dedicação.',
  visao:
    'Ser uma comunidade inspiradora no relacionamento com Deus e interpessoal, de vida cristã responsável e bíblica, formando cidadãos em todas as esferas sociais.',
  valores: ['Simplicidade', 'Solidariedade', 'Responsabilidade', 'Relacionamento', 'Conhecimento'],
  selo_anos: '5 anos caminhando juntos',
  acao_solidaria:
    'Ação Solidária — todo 1º domingo do mês, traga 1kg de alimento. Sua generosidade alimenta famílias.',
  whatsapp: '5566999401544',
  youtube: 'https://www.youtube.com/@ibnrondonopolis',
  instagram: 'https://www.instagram.com/ibnrondonopolis',
  facebook: 'https://www.facebook.com/search/top?q=IBN%20Rondonopolis',
  endereco: 'Rua José Barriga, nº 3025 — Jardim Gramado, Rondonópolis/MT',
  maps_query: 'Rua José Barriga, 3025 - Jardim Gramado, Rondonópolis - MT',
  pix_chave: '51.854.887/0001-16',
  pix_titular: 'Igreja Batista Nacional de Rondonópolis',
  cnpj: '51.854.887/0001-16',
  drive_api_key: '',
}

// Link da live: com ativo=true aparece o badge AO VIVO + player.
export const DEFAULT_LIVE = {
  url: 'https://www.youtube.com/live/3m2OShzPKmU',
  ativo: false,
}

// dia: 0=domingo … 6=sábado (horário de Cuiabá)
export const DEFAULT_CULTOS = [
  { id: 'c1', dia: 3, hora: '19:30', nome: 'Culto da Vitória', ordem: 1 },
  { id: 'c2', dia: 5, hora: '19:00', nome: 'Culto de Oração', ordem: 2 },
  { id: 'c3', dia: 0, hora: '18:30', nome: 'Culto da Família', ordem: 3 },
]

export const DEFAULT_EVENTOS = [
  {
    id: 'e1',
    titulo: 'Encontro com Deus',
    descricao:
      'Um fim de semana para recomeçar. Deixe seu contato e avisaremos assim que as datas forem liberadas.',
    data: null,
    imagem_url: '/img/louvor.jpg',
    link_inscricao: '',
    ordem: 1,
  },
]

export const DEFAULT_MINISTERIOS = [
  { id: 'm1', nome: 'Inspira Jovens', descricao: 'Juventude que vive a fé com intensidade e propósito.', horario: 'Consulte a agenda', icone: 'flame', ordem: 1 },
  { id: 'm2', nome: 'Inspira Teens', descricao: 'Um espaço seguro para adolescentes crescerem com Deus e com amigos.', horario: 'Consulte a agenda', icone: 'sparkles', ordem: 2 },
  { id: 'm3', nome: 'Mulheres', descricao: 'Mulheres fortalecidas na Palavra, em comunhão e cuidado umas com as outras.', horario: 'Consulte a agenda', icone: 'flower', ordem: 3 },
  { id: 'm4', nome: 'Homens', descricao: 'Homens firmes na fé, liderando suas casas com propósito.', horario: 'Consulte a agenda', icone: 'shield', ordem: 4 },
  { id: 'm5', nome: 'Ação Solidária', descricao: 'Fé que se transforma em gesto. Todo 1º domingo do mês.', horario: '1º domingo do mês · 18h30', icone: 'hand-heart', ordem: 5 },
]

export const DEFAULT_ALBUNS = [
  { id: 'a1', nome: 'Conferência Despertar · 5 anos', folder_id: '1jp-9SPuzOe9WWswq4-V51BVXo2p7z6d4', ordem: 1 },
]

export const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

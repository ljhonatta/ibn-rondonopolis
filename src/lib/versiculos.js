// Versículo do dia: lista fixa, um por dia (gira pelo dia do ano).
export const VERSICULOS = [
  ['O Senhor é o meu pastor; nada me faltará.', 'Salmos 23:1'],
  ['Tudo posso naquele que me fortalece.', 'Filipenses 4:13'],
  ['Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.', 'Salmos 119:105'],
  ['Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.', 'Mateus 11:28'],
  ['O amor é paciente, o amor é bondoso.', '1 Coríntios 13:4'],
  ['Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.', 'Salmos 37:5'],
  ['Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos.', 'Filipenses 4:4'],
  ['Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.', 'Salmos 46:1'],
  ['Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.', 'João 3:16'],
  ['Sede fortes e corajosos; não temais, porque o Senhor vosso Deus é convosco.', 'Josué 1:9'],
  ['Buscai primeiro o Reino de Deus e a sua justiça.', 'Mateus 6:33'],
  ['As misericórdias do Senhor se renovam a cada manhã.', 'Lamentações 3:22-23'],
  ['Eu sou o caminho, a verdade e a vida.', 'João 14:6'],
  ['Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.', '1 Pedro 5:7'],
  ['Oh! Quão bom e quão suave é que os irmãos vivam em união.', 'Salmos 133:1'],
  ['Não andeis ansiosos por coisa alguma; em tudo, pela oração, sejam conhecidos os vossos pedidos.', 'Filipenses 4:6'],
  ['O choro pode durar uma noite, mas a alegria vem pela manhã.', 'Salmos 30:5'],
  ['Todas as coisas cooperam para o bem daqueles que amam a Deus.', 'Romanos 8:28'],
  ['Levantarei os meus olhos para os montes; de onde vem o meu socorro? O meu socorro vem do Senhor.', 'Salmos 121:1-2'],
  ['Vós sois a luz do mundo.', 'Mateus 5:14'],
  ['A paz vos deixo, a minha paz vos dou.', 'João 14:27'],
  ['Os que esperam no Senhor renovarão as suas forças.', 'Isaías 40:31'],
  ['Eu e a minha casa serviremos ao Senhor.', 'Josué 24:15'],
  ['Provai e vede que o Senhor é bom.', 'Salmos 34:8'],
  ['Amai-vos uns aos outros, assim como eu vos amei.', 'João 15:12'],
  ['Se o Senhor não edificar a casa, em vão trabalham os que a edificam.', 'Salmos 127:1'],
  ['Cada um dê conforme determinou em seu coração, pois Deus ama quem dá com alegria.', '2 Coríntios 9:7'],
  ['Clama a mim, e responder-te-ei.', 'Jeremias 33:3'],
  ['Onde estiverem dois ou três reunidos em meu nome, ali estou no meio deles.', 'Mateus 18:20'],
  ['O Senhor te abençoe e te guarde.', 'Números 6:24'],
  ['Eis que estou convosco todos os dias, até a consumação dos séculos.', 'Mateus 28:20'],
]

export function versiculoDoDia(d = new Date()) {
  const inicio = new Date(d.getFullYear(), 0, 0)
  const dia = Math.floor((d - inicio) / 86400000)
  return VERSICULOS[dia % VERSICULOS.length]
}

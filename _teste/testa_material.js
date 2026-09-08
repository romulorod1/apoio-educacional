/* Gera o PDF de um tema de verdade e confere o resultado.
 *
 * Este arquivo já esteve no portão de merge sem afirmar nada: ele gerava os
 * quatro PDFs, imprimia o tamanho e saía. Como não imprimia linha de resumo, o
 * confere_tudo.sh, que aprovava por AUSÊNCIA de falha, marcava "ok" toda vez.
 * Um gerador que só não estoura não é conferência: agora ele afirma.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

const banco = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'temas', 'banco.json'), 'utf8'));
const tema = banco.temas.find(t => t.id === 'MAT06-05');
console.log('tema:', tema.pt.titulo, '|', tema.pt.exercicios.length, 'exercicios');

function gerar(nome, minKB, op) {
  const bytes = PDFGen.gerarMaterialTema(Object.assign({ tema }, op));
  fs.writeFileSync(path.join(__dirname, nome), bytes);
  const kb = Math.round(bytes.length / 1024);
  console.log('  ' + nome + ': ' + kb + ' KB');
  const bruto = Buffer.from(bytes).toString('latin1');

  conf(nome + ': é um PDF de verdade',
    bruto.slice(0, 5) === '%PDF-' && bruto.trim().slice(-5) === '%%EOF', true);
  /* Piso de tamanho por folha. Um gerador que perde uma seção inteira continua
   * escrevendo um PDF válido: sem piso, a perda passa calada. */
  conf(nome + ': tem pelo menos ' + minKB + ' KB', kb >= minKB, true);

  /* Marcação que vazou para a folha. O "@fig" já saiu impresso por extenso uma
   * vez, e o "^{" sairia igual se a tubulação rica não pegasse a linha. */
  ['@fig', '^{', '_{', '**'].forEach(function (m) {
    const escapado = m.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
    const rx = new RegExp('Td \\([^)]*' + escapado);
    conf(nome + ': a marcação "' + m + '" não sai impressa', rx.test(bruto), false);
  });

  /* E a mesma pergunta feita de forma GENÉRICA: qualquer arroba seguida de letra
   * no texto desenhado. A lista literal acima só pega a diretiva que alguém
   * lembrou de escrever nela, e foi exatamente assim que o buraco do "@eq"
   * sobreviveu: o conserto de então foi feito só para o "@fig", a lista ficou
   * com "@fig" dentro, e a folha saiu com "@eq \begin{bmatrix} ..." impresso no
   * meio do exercício, em silêncio. Quando nascer "@tabela", o buraco não
   * reabre.
   *
   * A linha de base foi medida antes de a trava ser escrita, e não presumida:
   * as 296 folhas do banco (148 temas nas duas línguas, com material, lista e
   * gabarito) trazem ZERO arroba seguida de letra no texto desenhado, e a fonte
   * dos temas só tem "@fig" e "@eq" como arroba. Por isso a asserção é zero e
   * não "não cresceu além de N": não há ocorrência legítima para preservar.
   * Medido em 08/09/2026. Se um dia um tema precisar escrever um endereço de
   * e-mail na folha, o número muda AQUI, com a data e o motivo ao lado. */
  conf(nome + ': nenhuma arroba seguida de letra no texto desenhado',
    arrobasDesenhadas(bytes).join(', ') || 0, 0);

  return bytes;
}

/* As peças de texto realmente desenhadas na folha, que é o que a aluna lê. */
function pecasDeTexto(bytes) {
  const cru = Buffer.from(bytes).toString('latin1');
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m; const pecas = [];
  while ((m = rx.exec(cru))) pecas.push(m[1]);
  return pecas;
}
function arrobasDesenhadas(bytes) {
  const achadas = [];
  pecasDeTexto(bytes).forEach(function (p) {
    (p.match(/@[A-Za-z][A-Za-z0-9]*/g) || []).forEach(function (a) { achadas.push(a); });
  });
  return [...new Set(achadas)];
}

/* Quanto traço vetorial a folha tem. O colchete da matriz é DESENHADO, e não
 * glifo de fonte, então ele aparece nesta contagem e nunca no texto: é ela que
 * separa "a fórmula foi desenhada" de "a fórmula sumiu da folha". */
function tracosDaFolha(bytes) {
  const cru = Buffer.from(bytes).toString('latin1');
  return (cru.match(/(?:^|\s)[ml](?=\s)/g) || []).length;
}

const completo = gerar('tema_completo.pdf', 60, {
  lingua: 'pt', incluirMaterial: true, incluirLista: true, incluirGabarito: true,
  aluno: 'Marcelo', data: '10/06/2026'
});
const soLista = gerar('tema_so_lista.pdf', 12, {
  lingua: 'pt', incluirLista: true, aluno: 'Marcelo', espacoParaResposta: 26
});
const selecao = gerar('tema_selecao.pdf', 8, {
  lingua: 'pt', incluirLista: true, incluirGabarito: true, escolhidos: [1, 8, 13, 17, 18]
});
const ingles = gerar('tema_ingles.pdf', 40, {
  lingua: 'en', incluirMaterial: true, incluirLista: true
});

console.log('\n=== o que cada folha tem que conter ===');

/* A folha completa tem as três seções; a de lista só tem uma. Sem isto, perder o
 * gabarito inteiro passaria pelo piso de tamanho sem acusar nada. */
conf('a folha completa é maior que a de só lista', completo.length > soLista.length * 2, true);
conf('a seleção de 5 exercícios é menor que a lista dos 18', selecao.length < soLista.length, true);

const txtPt = Buffer.from(completo).toString('latin1');
const txtEn = Buffer.from(ingles).toString('latin1');
conf('a folha em português traz o nome do aluno', /Td \([^)]*Marcelo/.test(txtPt), true);

/* Palavra portuguesa presa no gerador e impressa na folha em inglês. Já
 * aconteceu duas vezes: o desenhador de figuras escrevia "Figura fora de
 * escala." cravado, e a moldura escrevia "Página N de M" no rodapé das nove
 * páginas da folha inglesa (e das de todos os 146 temas).
 *
 * A segunda passou por baixo da primeira versão desta conferência, que era uma
 * LISTA DE PALAVRAS escolhida a dedo: "Página" não estava nela. Lista de
 * palavras só pega o que quem escreveu já imaginou.
 *
 * Agora a conferência é estrutural: varre TODA peça de texto desenhada na folha
 * inglesa e recusa marca de português, seja ela qual for. As duas exceções são
 * nome próprio e marca, que não se traduzem.
 *
 * As marcas têm que ser INEQUÍVOCAS. Uma versão anterior usava "Exerc" e
 * acusava a folha inglesa por causa de "Exercises": "Exerc" é prefixo das duas
 * línguas. Alarme falso aqui é o que treina a ignorar o alarme. */
{
  const NAO_TRADUZ = ['Nathália Wajsenzon', 'APOIO EDUCACIONAL',
    'Nathália Wajsenzon · Apoio Educacional', 'NW'];
  const MARCA_PT = /ção|ções|ário|Página|Aluno|Gabarito|Exercícios|Figura|Resposta|ê|õ|ç/;

  const pecasEn = [];
  const rxEn = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let mEn;
  while ((mEn = rxEn.exec(txtEn))) pecasEn.push(mEn[1]);

  const suspeitas = pecasEn.filter(function (t) {
    return NAO_TRADUZ.indexOf(t) < 0 && MARCA_PT.test(t);
  });
  conf('nenhuma marca de português na folha em inglês',
    suspeitas.length ? JSON.stringify([...new Set(suspeitas)].slice(0, 5)) : 0, 0);

  // e a numeração de página tem que estar na língua da folha
  conf('a folha em inglês numera em inglês', /Td \(Page \d+ of \d+\)/.test(txtEn), true);
  conf('a folha em português numera em português', /Td \(P.gina \d+ de \d+\)/.test(txtPt), true);
}

/* Todo caractere escrito tem que ser desenhável. É a mesma trava que o
 * verificar.py aplica na fonte dos temas, aqui aplicada na SAÍDA, que é o que a
 * aluna recebe. */
if (typeof PDFGen.caracteresQueNaoDesenha === 'function') {
  const escritos = [];
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m;
  while ((m = rx.exec(txtPt))) escritos.push(m[1]);
  const ruins = PDFGen.caracteresQueNaoDesenha(escritos.join(' '));
  conf('nenhum caractere indesenhável na folha gerada', ruins.length, 0);
}

console.log('\n=== a diretiva dentro do exercício, com par envenenado ===');

/* A diretiva "@eq" funcionava na EXPLICAÇÃO e saía impressa como LaTeX cru
 * quando estava dentro de um exercício ou de uma resposta, sem aviso nenhum. Na
 * folha da criança aparecia, escrito por extenso:
 *
 *   Escreva o elemento da segunda linha e primeira coluna da matriz.
 *   @eq A = \begin{bmatrix} 1 & 2 \\ 3 & 5 \end{bmatrix}
 *
 * Medido em 07/09/2026 sobre uma cópia do MATEM2-04: material 3 ocorrências,
 * lista 2, gabarito 1 e explicação 0. É o mesmo defeito que o pdf.js registra
 * ter acontecido com o "@fig", e que foi consertado SÓ para o "@fig".
 *
 * A trava é um par envenenado, e não uma contagem de zero solta: sem o controle
 * positivo, "não achei @eq na folha" seria satisfeito por uma folha em que a
 * fórmula simplesmente desapareceu, que é trocar um defeito visível por um
 * invisível. */
{
  const MATRIZ = '\\begin{bmatrix} 1 & 2 \\\\ 3 & 5 \\end{bmatrix}';
  const TRANSPOSTA = '\\begin{bmatrix} 1 & 3 \\\\ 2 & 5 \\end{bmatrix}';

  /* O envenenado e o limpo saem da MESMA função, e a única diferença entre eles
   * é a diretiva: assim a comparação é folha com folha, e não folha com
   * lembrança. A diretiva vai colada no fim do texto, que é a forma como o
   * gerar_banco.py entrega uma diretiva escrita em linha própria dentro do
   * item. */
  function preparar(comDiretiva) {
    const t = JSON.parse(JSON.stringify(tema));
    function mais(texto, diretiva) { return comDiretiva ? texto + ' ' + diretiva : texto; }
    ['pt', 'en'].forEach(function (lg) {
      if (!t[lg] || !t[lg].exercicios || !t[lg].exercicios.length) return;
      const ex = t[lg].exercicios;
      ex[0].enunciado = mais(ex[0].enunciado, '@eq ' + MATRIZ);
      ex[0].resposta = mais(ex[0].resposta, '@eq ' + TRANSPOSTA);
      t[lg].explicacao = comDiretiva ? t[lg].explicacao + '\n\n@eq ' + MATRIZ + '\n'
                                     : t[lg].explicacao;
    });
    return t;
  }

  const venenoso = preparar(true);
  const limpo = preparar(false);
  const cruVenenoso = JSON.stringify(venenoso);
  const cruLimpo = JSON.stringify(limpo);

  /* O veneno pegou? Veneno que não casa nada deixa o modo envenenado verde
   * afirmando o contrário do que promete, e isso já aconteceu neste portão. */
  conf('o veneno mudou mesmo o tema', cruVenenoso !== cruLimpo, true);
  conf('e ele plantou 6 diretivas @eq (3 por língua)',
    (cruVenenoso.match(/@eq/g) || []).length, 6);
  conf('e o tema limpo não ficou com nenhuma', (cruLimpo.match(/@eq/g) || []).length, 0);

  /* E o detector detecta: sem esta linha, "zero ocorrências" nas folhas abaixo
   * seria satisfeito por um detector quebrado. */
  conf('o detector genérico acha arroba seguida de letra quando ela existe',
    arrobasDesenhadas(Buffer.from('BT /F1 10 Tf 1 1 Td (veja @eq e @tabela) Tj ET', 'latin1'))
      .join(','), '@eq,@tabela');

  const FOLHAS = [
    ['material completo', { lingua: 'pt', incluirMaterial: true, incluirLista: true, incluirGabarito: true }],
    ['só a lista', { lingua: 'pt', incluirLista: true, espacoParaResposta: 26 }],
    ['só o gabarito', { lingua: 'pt', incluirGabarito: true }],
    ['a folha em inglês', { lingua: 'en', incluirMaterial: true, incluirLista: true, incluirGabarito: true }]
  ];
  FOLHAS.forEach(function (par) {
    const rotulo = par[0], op = par[1];
    const comEq = PDFGen.gerarMaterialTema(Object.assign({ tema: venenoso }, op));
    const semEq = PDFGen.gerarMaterialTema(Object.assign({ tema: limpo }, op));

    // veneno: a marcação não pode sair impressa em lugar nenhum da folha
    conf(rotulo + ': nenhuma arroba seguida de letra sai impressa',
      arrobasDesenhadas(comEq).join(', ') || 0, 0);
    /* E nem o LaTeX cru sem a arroba, que passaria pela linha de cima: o dia em
     * que alguém "consertar" isto apagando só os três caracteres da diretiva, a
     * folha continua com "\begin{bmatrix} 1 & 2" escrito. */
    conf(rotulo + ': nem o LaTeX cru sai impresso',
      /bmatrix|\\begin|\\frac/.test(pecasDeTexto(comEq).join(' ')), false);

    // controle positivo: a fórmula está DESENHADA, e não apenas ausente
    conf(rotulo + ': a fórmula foi desenhada (mais traço que a folha sem @eq)',
      tracosDaFolha(comEq) > tracosDaFolha(semEq), true);
  });

  /* E o texto do exercício continua na folha: sem isto, "o LaTeX sumiu" seria
   * satisfeito por um item que perdeu o enunciado junto com a fórmula. */
  const listaComEq = PDFGen.gerarMaterialTema({
    tema: venenoso, lingua: 'pt', incluirLista: true, espacoParaResposta: 26
  });
  const listaSemEq = PDFGen.gerarMaterialTema({
    tema: limpo, lingua: 'pt', incluirLista: true, espacoParaResposta: 26
  });
  const primeiraPalavra = String(tema.pt.exercicios[0].enunciado).split(/\s+/)[0];
  conf('o enunciado do exercício envenenado continua escrito na folha',
    pecasDeTexto(listaComEq).indexOf(primeiraPalavra) >= 0, true);
  conf('e ele já estava escrito na folha limpa, que é a comparação justa',
    pecasDeTexto(listaSemEq).indexOf(primeiraPalavra) >= 0, true);
}

console.log('\n=== o navegador recebe o kit de figuras inteiro ===');

/* No Node os módulos se acham por require. No NAVEGADOR não: cada um procura o
 * global do vizinho (FigMarcas, FigDesenho, Formula) e, não achando, desiste em
 * silêncio. Faltando um arquivo no index.html, a figura sai SEM MARCA NENHUMA,
 * sem erro e sem aviso, e só se descobre na folha impressa.
 *
 * Aconteceu: o index.html declarava só o base.js e o receitas.js, e os outros
 * três nunca chegavam ao tablet. Conferido rodando os arquivos num contexto sem
 * require, que é o que o navegador faz.
 *
 * O sw.js precisa da mesma lista: ela dá aula na casa das famílias, muitas vezes
 * sem sinal, e o que não está no cache não existe quando falta rede. */
{
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  /* O kit sai do index.html de HOJE, e não de uma lista escrita à mão aqui.
   * Lista literal só confere o que alguém lembrou de escrever nela: um sexto
   * arquivo de figuras entrando em produção fora do cache passava batido, e a
   * lista ainda precisou ser editada à mão na última vez que o kit cresceu. */
  const KIT = [...new Set((html.match(/src="figuras\/[\w.-]+\.js"/g) || [])
    .map(function (s) { return s.replace(/.*figuras\//, '').replace(/"$/, ''); }))].sort();

  /* E o index.html tem que carregar TODO módulo de figuras/ que existe no disco
   * (os arquivos sem prefixo "_" e sem "testa_", que são as provas). Sem esta
   * linha a conferência abaixo ficaria vazia quando o index.html perdesse os
   * <script>: laço sobre lista vazia passa sempre, calado. */
  const modulos = fs.readdirSync(path.join(__dirname, '..', 'figuras'))
    .filter(function (f) {
      return f.endsWith('.js') && !f.startsWith('_') && !f.startsWith('testa_');
    }).sort();
  conf('o index.html carrega todo módulo de figuras/ que existe no disco',
    modulos.filter(function (m) { return KIT.indexOf(m) < 0; }).join(', ') || 0, 0);

  /* A lista do sw.js é RECORTADA antes da busca, e sem os comentários dela. A
   * versão anterior procurava o nome no arquivo inteiro com indexOf, e um
   * comentário do próprio sw.js que cita './figuras/solidos.js' passou a
   * satisfazer a trava sozinho: dava para apagar a linha da lista ARQUIVOS que
   * esta suíte passava inteira, com o arquivo fora do pacote offline. */
  const bloco = (sw.match(/var ARQUIVOS = \[[\s\S]*?\n\];/) || [''])[0]
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
  const noCache = new Set((bloco.match(/'[^']*'/g) || [])
    .map(function (s) { return s.slice(1, -1).replace(/^\.\//, ''); }));
  conf('o sw.js tem uma lista ARQUIVOS com entradas', noCache.size > 0, true);

  KIT.forEach(function (arq) {
    const existe = fs.existsSync(path.join(__dirname, '..', 'figuras', arq));
    conf('figuras/' + arq + ' existe', existe, true);
    if (!existe) return;
    conf('  o sw.js guarda ' + arq + ' na lista ARQUIVOS', noCache.has('figuras/' + arq), true);
  });

  /* E o pdf.js tem que continuar servindo SEM o kit ao lado: quem gera um
   * fechamento de mês não carrega desenhador de triângulo. */
  conf('o pdf.js gera folha sem depender do kit',
    (function () {
      try {
        const d = new PDFGen.Doc();
        d.novaPagina();
        d.markdown('Um parágrafo comum, sem figura nenhuma.', { tam: 10 });
        return d.finalizar().length > 500;
      } catch (e) { return false; }
    })(), true);
}

console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);

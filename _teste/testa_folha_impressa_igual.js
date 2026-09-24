/* testa_folha_impressa_igual.js
 *
 * A FOLHA IMPRESSA NÃO MUDOU, e isto é medido, não afirmado.
 *
 * A B10 unificou a ordem das camadas da folha: o canvas passou a desenhar na
 * mesma ordem em que o PDF sempre desenhou (imagem, tapar, texto, traço). A
 * unificação foi pelo lado da TELA, de propósito, porque o papel é o artefato
 * que a Nathália entrega ao aluno e não pode mudar debaixo dela.
 *
 * Mas "não pode mudar" é promessa, e promessa não confere nada. Esta prova
 * gera a MESMA folha com o pdf.js de hoje e com o pdf.js do `d80bb90` (o
 * aplicativo publicado, antes da B10) e compara. Compara duas vezes, porque
 * as duas comparações respondem coisas diferentes:
 *
 *   1. BYTE A BYTE, fora o que muda por construção em todo PDF (a data de
 *      criação). Byte igual é a resposta mais forte que existe: se os bytes
 *      são os mesmos, não há pixel que possa diferir.
 *   2. PIXEL A PIXEL, rasterizando as duas páginas. É a resposta que a
 *      pergunta pede ao pé da letra, e ela pega o caso em que os bytes diferem
 *      por reordenação inócua e o desenho continua igual.
 *
 * A FOLHA EXERCITA A SOBREPOSIÇÃO, que é o único lugar onde a ordem das
 * camadas pode aparecer: imagem embaixo, texto por cima dela, traço cruzando
 * os dois, e um texto ANTES da imagem no vetor, que é o caso em que a ordem do
 * vetor e a ordem das camadas discordam. Sem esse último item a folha não
 * mediria nada: com todo mundo na mesma ordem nos dois esquemas, qualquer um
 * dos dois daria o mesmo desenho.
 *
 *   node _teste/testa_folha_impressa_igual.js [--guarda-a-prova <pasta>]
 *   node _teste/testa_folha_impressa_igual.js --envenenado-ordem
 *   node _teste/testa_folha_impressa_igual.js --envenenado-tapar
 *
 * Com --guarda-a-prova, grava a folha do FIXTURE na pasta, com nome que diz o
 * que ela é. Ela NÃO vai para o marco visual: ver a nota da opção, embaixo.
 *
 * O ALCANCE DESTA PROVA, ESCRITO ANTES QUE ALGUÉM SE ANIME COM O VERDE:
 *
 * CONTRA O DIFF QUE ELA ESTREIA, A COMPARAÇÃO BYTE A BYTE É INERTE. O pdf.js só
 * ganhou um ramo para um tipo de item (`tapar`) que folha nenhuma de antes tem;
 * sem item desse tipo a bandeira `tapou` fica falsa e o laço não chega a emitir
 * operador nenhum. Byte igual era o ÚNICO resultado possível. Dizer "provei que
 * não mudou" sem dizer "e nesta versão não tinha como mudar" é o começo da
 * régua que ninguém mais questiona.
 *
 * (Este parágrafo descreveu por um tempo uma variável `tapar` e um `if (tapar)`
 * que a implementação já não tinha. Comentário que descreve código de ontem é a
 * mesma família da âncora de veneno que envelhece: parece conferência e não é.)
 *
 * E É POR ISSO QUE A MEDIDA DO RETÂNGULO EXISTE, mais abaixo. O ramo novo do
 * pdf.js precisava de uma prova que o exercitasse, e por duas rodadas ele não
 * teve nenhuma: havia um bloco que dizia comparar três documentos com e sem
 * placa e que, no código, gerava a folha do fixture (que não tem `tapar`) contra
 * um documento sem folha. Agora a folha com retângulo é gerada de verdade e o
 * papel é medido em pixel, com o veneno `--envenenado-tapar` ao lado.
 *
 * O que ela vale, então, é o DEPOIS: ela é o guarda que fica de pé para o
 * próximo diff, quando alguém mexer na ordem de desenho por um motivo
 * qualquer. E para isso ela precisa MORDER, o que é outra coisa de ter
 * controle de medidor. Por isso existe o `--envenenado-ordem`: ele troca a
 * ordem DENTRO do pdf.js de hoje, pondo o texto antes da imagem, e a prova tem
 * de gritar com a contagem de pixels na mão. A folha foi construída para
 * discordar exatamente nesse ponto; se ela não gritar, o fixture não é tão
 * assimétrico quanto quem o escreveu pensa.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const ANTES = 'd80bb90';          // o aplicativo publicado, antes da B10
/* ONDE GUARDAR OS ARTEFATOS DA PROVA, e por que a opção mudou de nome.
 *
 * Ela se chamava `--prints` e escrevia dentro da pasta do MARCO VISUAL, com o
 * nome do print seguinte da série. O resultado foi que a folha desta prova (um
 * fixture com retângulo preto opaco, um ponto de caneta solto e duas frases que
 * descrevem o cenário testado) foi parar no meio das telas mandadas ao olho de
 * fora cego, e ele gastou três parágrafos analisando artefato nosso com
 * seriedade. Estava certo, e a culpa não era dele: toda atenção gasta num
 * artefato de teste é atenção que não foi gasta no produto, e o olho de fora
 * não tem como saber a diferença, porque é por não saber que ele vale.
 *
 * Fixture de prova serve à prova e fica na prova. A opção continua existindo,
 * porque olhar o que a prova mediu é legítimo, mas o nome do arquivo agora diz
 * o que ele é e a pasta é escolhida por quem chama. */
const I_PROVA = process.argv.indexOf('--guarda-a-prova');
const PROVA = I_PROVA !== -1 ? process.argv[I_PROVA + 1] : null;
const VENENO_ORDEM = process.argv.indexOf('--envenenado-ordem') !== -1;
const VENENO_TAPAR = process.argv.indexOf('--envenenado-tapar') !== -1;
const VENENO_CONTORNO = process.argv.indexOf('--envenenado-contorno-no-papel') !== -1;

let passes = 0, falhas = 0;
function conf(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) { passes++; console.log('  OK    ' + nome); }
  else { falhas++; console.log('  FALHA ' + nome + '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'); }
  return ok;
}

/* A FOLHA. Um só objeto, usado pelos dois lados, para a comparação ser sobre o
 * código e não sobre a peça. */
function folha() {
  const pontos = [];
  for (let i = 0; i <= 40; i++) {
    const x = 80 + i * 21;
    pontos.push([x, 620 + Math.round(70 * Math.sin(i / 3)), 2 + (i % 5)]);
  }
  return [{
    data: '2026-09-24',
    paginas: [{
      fundo: 'pautado',
      itens: [
        // ANTES da imagem no vetor: é este que faz a ordem do vetor discordar
        // da ordem das camadas, e sem ele a folha não mede nada
        { t: 'texto', x: 70, y: 150, tam: 30, cor: '#B4453C', txt: 'texto escrito antes da imagem entrar' },
        { t: 'imagem', ref: 'recorte-1', x: 60, y: 120, w: 600, h: 300 },
        { t: 'texto', x: 90, y: 250, tam: 34, cor: '#1F3A5F', txt: 'texto por cima do recorte' },
        { t: 'traco', cor: '#2E7D6B', pontos: pontos },
        { t: 'traco', cor: '#C9A961', marcatexto: true, pontos: [[70, 260, 6], [640, 268, 6]] },
        { t: 'traco', cor: '#1A1C1F', pontos: [[500, 900, 9]] }
      ]
    }]
  }];
}

/* Um JPEG mínimo de verdade, para a imagem da folha ter bytes reais. É o mesmo
 * nos dois lados, e sai daqui e não de um arquivo, para a prova não depender
 * de nada fora do repositório. */
const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAAQABABAREA/8QAHwAAAQUBAQEB' +
  'AQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1Fh' +
  'ByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZ' +
  'WmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXG' +
  'x8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APn+iiiiiiiiiiiiiv/Z',
  'base64');

function geraCom(arquivoPdfJs) {
  const raiz = {};
  const codigo = fs.readFileSync(arquivoPdfJs, 'utf8');
  // o pdf.js é um IIFE que pendura PDFGen na raiz que recebe
  new Function('self', codigo + '\nreturn self;')(raiz);
  const Core = require(path.join(RAIZ, 'core.js'));
  const db = {
    alunos: [{ id: 'a1', nome: 'Aluno de Prova', valorHora: 100, cor: '#1F3A5F' }],
    aulas: [{ id: 'x1', alunoId: 'a1', data: '2026-09-10', hora: '08:00', duracaoMin: 60,
      status: 'realizada', cobravel: true }],
    resumos: []
  };
  const f = Core.calcularFechamento(db, 'a1', '2026-09');
  return raiz.PDFGen.gerarFechamento(f, {
    incluirNotas: true, notas: folha(),
    imagens: { 'recorte-1': { bytes: JPEG, w: 16, h: 16 } },
    sempreResumo: true
  });
}

/* A MESMA ESTEIRA, com uma folha montada aqui. `itens` null gera o documento
 * SEM folha nenhuma, que é o outro lado do delta da marca d'água; qualquer
 * outro vetor vira a folha, e `comImagem` decide se o JPEG do fixture entra. */
function geraComTapar(arquivoPdfJs, itens, comImagem) {
  const raiz = {};
  new Function('self', fs.readFileSync(arquivoPdfJs, 'utf8') + '\nreturn self;')(raiz);
  const Core = require(path.join(RAIZ, 'core.js'));
  const db = {
    alunos: [{ id: 'a1', nome: 'Aluno de Prova', valorHora: 100, cor: '#1F3A5F' }],
    aulas: [{ id: 'x1', alunoId: 'a1', data: '2026-09-10', hora: '08:00', duracaoMin: 60,
      status: 'realizada', cobravel: true }],
    resumos: []
  };
  const f = Core.calcularFechamento(db, 'a1', '2026-09');
  return raiz.PDFGen.gerarFechamento(f, itens === null
    ? { incluirNotas: false, sempreResumo: true }
    : {
      incluirNotas: true,
      notas: [{ data: '2026-09-24', paginas: [{ fundo: 'branco', itens: itens }] }],
      imagens: comImagem ? { 'recorte-1': { bytes: JPEG, w: 16, h: 16 } } : {},
      sempreResumo: true
    });
}

/* Conta os pixels diferentes entre a MESMA página de dois PDFs, pelo mesmo
 * rasterizador que a comparação principal usa. */
function difDePixel(bytesA, bytesB, pagina, tmp, nome) {
  const a = path.join(tmp, nome + '_a.pdf'), b = path.join(tmp, nome + '_b.pdf');
  fs.writeFileSync(a, Buffer.from(bytesA));
  fs.writeFileSync(b, Buffer.from(bytesB));
  try {
    const r = execFileSync('python', [path.join(__dirname, '_rasteriza_compara.py'), a, b, String(pagina)],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    return JSON.parse(r.trim().split('\n').pop());
  } catch (e) { return { erro: String((e && e.message) || e).slice(0, 200) }; }
}

/* Todo PDF carrega a data de criação, que muda a cada corrida por construção.
 * Zerar só ela é o que separa "o desenho mudou" de "o relógio andou". */
function semData(bytes) {
  const b = Buffer.from(bytes);
  const s = b.toString('latin1').replace(/\(D:\d{14}[^)]*\)/g, '(D:00000000000000)');
  return Buffer.from(s, 'latin1');
}

(async () => {
  console.log('A folha impressa não mudou: ' + ANTES + ' contra o HEAD de hoje\n');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'folha_igual_'));
  process.on('exit', () => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ok */ } });

  const pdfAntes = path.join(tmp, 'pdf_antes.js');
  fs.writeFileSync(pdfAntes, execFileSync('git', ['show', ANTES + ':pdf.js'],
    { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  let pdfHoje = path.join(RAIZ, 'pdf.js');

  /* O VENENO DA ORDEM: no pdf.js de hoje, as imagens deixam de ser desenhadas
   * primeiro e passam a ser desenhadas por último, depois dos textos. É
   * exatamente a inversão que a unificação das camadas existe para impedir, e
   * é a que a folha desta prova foi construída para denunciar: o primeiro
   * texto dela está DENTRO do retângulo da imagem, então invertida a ordem ele
   * some debaixo do recorte. */
  if (VENENO_ORDEM) {
    const fonte = fs.readFileSync(pdfHoje, 'utf8');
    const NL = fonte.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
    const desenha = [
      '      doc.registraImagem(it.ref, info.bytes, info.w, info.h);',
      '      doc.desenhaImagem(it.ref, x0 + it.x * escala, y0 + altura - (it.y + it.h) * escala,',
      '        it.w * escala, it.h * escala);'].join(NL);
    const guarda = '      _adiadas.push(it);';
    const marcaTracos = '    desenhaTracos(doc, itens, x0, y0, largura, altura, escala);';
    const solta = [
      '    _adiadas.forEach(function (it) {',
      '      var info = imagens && imagens[it.ref];',
      '      doc.registraImagem(it.ref, info.bytes, info.w, info.h);',
      '      doc.desenhaImagem(it.ref, x0 + it.x * escala, y0 + altura - (it.y + it.h) * escala,',
      '        it.w * escala, it.h * escala);',
      '    });',
      marcaTracos].join(NL);
    /* AS TRÊS ÂNCORAS SÃO CONTADAS, e não só duas. A terceira passava trocada
     * sem contagem, e uma âncora que deixa de casar e não reclama é um veneno
     * que deixou de envenenar em silêncio, que é o pior defeito que uma prova
     * pode ter. Achado pela segunda lente cega do PR #57. */
    const ancoraItens = '    var itens = pagina.itens || [];';
    conf('a âncora do desenho da imagem casa exatamente uma vez', fonte.split(desenha).length - 1, 1);
    conf('a âncora dos traços casa exatamente uma vez', fonte.split(marcaTracos).length - 1, 1);
    conf('a âncora da lista de itens casa exatamente uma vez', fonte.split(ancoraItens).length - 1, 1);
    const envenenado = fonte
      .split(desenha).join(guarda)
      .split(ancoraItens).join(ancoraItens + NL + '    var _adiadas = [];')
      .split(marcaTracos).join(solta);
    conf('o veneno mudou mesmo o pdf.js', envenenado !== fonte ? 'diferente' : 'IGUAL', 'diferente');
    const alvo = path.join(tmp, 'pdf_envenenado.js');
    fs.writeFileSync(alvo, envenenado);
    pdfHoje = alvo;
  }

  /* O VENENO DO CONTORNO NO PAPEL: cada retângulo do tapar ganha um traço
   * preto em volta, dentro do próprio pdf.js servido. É o defeito que o teto
   * existe para pegar, e ele não existe no pdf.js de verdade: é aqui, e só sob
   * esta bandeira, que o contorno alcança o papel. */
  if (VENENO_CONTORNO) {
    const fonte = fs.readFileSync(pdfHoje, 'utf8');
    const ancora = "      if (!tapou) { doc.op('q'); tapou = true; }";
    conf('a âncora do contorno casa exatamente uma vez', fonte.split(ancora).length - 1, 1);
    const risca = ancora + " doc.op('0 0 0 RG 1 w ' + (x0 + r.x * escala).toFixed(2) + ' ' +" +
      " (y0 + altura - (r.y + r.h) * escala).toFixed(2) + ' ' + (r.w * escala).toFixed(2) + ' ' +" +
      " (r.h * escala).toFixed(2) + ' re S');";
    const envenenado = fonte.split(ancora).join(risca);
    conf('o veneno mudou mesmo o pdf.js', envenenado !== fonte ? 'diferente' : 'IGUAL', 'diferente');
    const alvo = path.join(tmp, 'pdf_com_contorno.js');
    fs.writeFileSync(alvo, envenenado);
    pdfHoje = alvo;
  }

  /* O VENENO DO TAPAR: o laço que emite os retângulos deixa de emitir. É o
   * guarda da medida nova, a que prova que o ramo do tapar pinta no papel, e
   * ele existe porque essa mudança do pdf.js entrou nesta frente sem medida
   * nenhuma até agora. */
  if (VENENO_TAPAR) {
    const fonte = fs.readFileSync(pdfHoje, 'utf8');
    const ancora = "      if (r.t !== 'tapar' || !(r.w > 0) || !(r.h > 0)) continue;";
    conf('a âncora do laço do tapar casa exatamente uma vez', fonte.split(ancora).length - 1, 1);
    const envenenado = fonte.split(ancora).join('      if (true) continue;');
    conf('o veneno mudou mesmo o pdf.js', envenenado !== fonte ? 'diferente' : 'IGUAL', 'diferente');
    const alvo = path.join(tmp, 'pdf_sem_tapar.js');
    fs.writeFileSync(alvo, envenenado);
    pdfHoje = alvo;
  }

  // o controle: os dois pdf.js TÊM de ser diferentes, senão a prova compara
  // um arquivo com ele mesmo e passa sem medir nada
  const fonteAntes = fs.readFileSync(pdfAntes, 'utf8');
  const fonteHoje = fs.readFileSync(pdfHoje, 'utf8');
  conf('o pdf.js de hoje é DIFERENTE do de ' + ANTES, fonteAntes === fonteHoje ? 'igual' : 'diferente', 'diferente');
  conf('e a diferença é a camada do tapar', /tapar/.test(fonteHoje) && !/tapar/.test(fonteAntes), true);
  /* O ALCANCE, MEDIDO E NÃO SUPOSTO: contra este diff a prova é inerte, porque
   * a folha de antes não tem item do tipo `tapar` e o ramo novo não chega a
   * emitir operador nenhum. A contagem abaixo é o que transforma essa frase de
   * opinião em número, e é ela que impede alguém de ler o verde como mais do
   * que ele é. */
  const comTapar = folha()[0].paginas[0].itens.filter(i => i.t === 'tapar').length;
  conf('a folha de antes não tem nenhum item do tipo tapar', comTapar, 0);

  const bAntes = geraCom(pdfAntes);
  const bHoje = geraCom(pdfHoje);
  fs.writeFileSync(path.join(tmp, 'antes.pdf'), Buffer.from(bAntes));
  fs.writeFileSync(path.join(tmp, 'hoje.pdf'), Buffer.from(bHoje));
  console.log('   bytes: ' + ANTES + ' ' + bAntes.length + ', hoje ' + bHoje.length);

  // 1. byte a byte
  const sa = semData(bAntes), sh = semData(bHoje);
  conf('a folha impressa sai com o MESMO tamanho', bHoje.length, bAntes.length);
  const iguais = Buffer.compare(sa, sh) === 0;
  if (!iguais) {
    let i = 0;
    while (i < Math.min(sa.length, sh.length) && sa[i] === sh[i]) i++;
    console.log('   primeiro byte diferente em ' + i + ': ' +
      JSON.stringify(sa.slice(Math.max(0, i - 40), i + 40).toString('latin1')) + ' contra ' +
      JSON.stringify(sh.slice(Math.max(0, i - 40), i + 40).toString('latin1')));
  }
  if (VENENO_ORDEM) conf('VENENO: a folha impressa MUDOU byte a byte', iguais, false);
  else conf('e BYTE A BYTE igual, fora a data de criação', iguais, true);

  // 2. pixel a pixel, rasterizando as duas com o PyMuPDF
  const pgFolha = (() => {
    /* A folha é a ÚLTIMA página do fechamento, e achar o número contando as
     * páginas do documento é mais seguro do que cravar um índice: se o
     * fechamento ganhar uma página um dia, um índice cravado passaria a
     * comparar a página errada e continuaria dizendo "igual". */
    const s = Buffer.from(bHoje).toString('latin1');
    const n = (s.match(/\/Type\s*\/Page[^s]/g) || []).length;
    return n - 1;
  })();
  console.log('   a folha é a página ' + (pgFolha + 1) + ' do documento');
  let medida = null;
  try {
    const saidaPng = PROVA && fs.existsSync(PROVA)
      ? path.join(PROVA, 'fixture_da_prova_folha.png') : path.join(tmp, 'folha.png');
    const r = execFileSync('python', [path.join(__dirname, '_rasteriza_compara.py'),
      path.join(tmp, 'antes.pdf'), path.join(tmp, 'hoje.pdf'), String(pgFolha), '--png', saidaPng],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    medida = JSON.parse(r.trim().split('\n').pop());
  } catch (e) {
    medida = { erro: String((e && e.message) || e).slice(0, 200) };
  }
  console.log('   raster: ' + JSON.stringify(medida));
  if (medida && medida.erro) {
    /* Sem rasterizador não se inventa um resultado: a comparação de pixel fica
     * DECLARADA como não feita, e isso é uma FALHA e não um silêncio, porque a
     * afirmação pedida era sobre pixel. */
    conf('a comparação de PIXEL rodou', medida.erro, '(sem erro)');
  } else {
    conf('a folha rasterizou nas duas versões, no mesmo tamanho', !!(medida && medida.largura > 0), true);
    if (VENENO_ORDEM) {
      /* A LINHA DA REPROVAÇÃO. Invertida a ordem, o texto que está dentro do
       * retângulo da imagem some debaixo dela, e a asserção do caso normal
       * ("zero diferentes") cai com o número na mão. */
      console.log('   A ASSERÇÃO DO CASO NORMAL REPROVARIA ASSIM:');
      console.log('   FALHA e PIXEL A PIXEL não há uma única diferença a 200 dpi  ' +
        '[obtido: ' + medida.diferentes + ' | esperado: 0]');
      conf('VENENO: a asserção MORDE, e a diferença é aos milhares',
        medida.diferentes > 1000, true);
      conf('VENENO: e o pior canal mostra que o desenho mudou de verdade, não por arredondamento',
        medida.pior_canal > 100, true);
    } else {
      conf('e PIXEL A PIXEL não há uma única diferença a 200 dpi', medida.diferentes, 0);
    }
    /* O CONTROLE DO MEDIDOR: ele tem de saber acusar. Comparada com a página
     * ANTERIOR do mesmo documento, a mesma medida tem de achar diferença aos
     * milhares; sem este par, "zero diferentes" não se distingue de um medidor
     * que devolve zero para tudo. */
    let controle = null;
    try {
      const r2 = execFileSync('python', [path.join(__dirname, '_rasteriza_compara.py'),
        path.join(tmp, 'antes.pdf'), path.join(tmp, 'hoje.pdf'), String(Math.max(0, pgFolha - 1))],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
      const outraPagina = JSON.parse(r2.trim().split('\n').pop());
      // a página anterior é a MESMA nos dois documentos, então aqui o controle
      // tem de ser o contrário: comparar a folha com a OUTRA página
      const r3 = execFileSync('python', [path.join(__dirname, '_rasteriza_compara_controle.py'),
        path.join(tmp, 'hoje.pdf'), String(pgFolha), String(Math.max(0, pgFolha - 1))],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
      controle = JSON.parse(r3.trim().split('\n').pop());
      console.log('   controle (a folha contra outra página do mesmo PDF): ' + JSON.stringify(controle));
      void outraPagina;
    } catch (e) {
      controle = { erro: String((e && e.message) || e).slice(0, 200) };
    }
    conf('e o medidor sabe acusar: duas páginas diferentes dão diferença aos milhares',
      !!(controle && controle.diferentes > 1000), true);
  }

  /* O TAPAR CORTA A MARCA D'ÁGUA, COMO TODA PLACA BRANCA DESTE GERADOR.
   *
   * Toda placa branca passa pelo `retangulo()`, que a anota em `pag.brancos`, e
   * é dessa lista que o `finalizar()` decide apagar a palavra da marca que
   * sairia CORTADA pela placa: é o caso em que sobra pedaço de letra do lado de
   * fora do corte. O tapar nascia fora dessa porta, emitido em operador cru, e
   * era a ÚNICA placa branca do aplicativo que não cortava nada. Achado pela
   * segunda lente cega do PR #57.
   *
   * (Aqui morava um parágrafo que descrevia três documentos e uma placa de
   * controle no canto, nenhum dos quais o código construía. Ele sobreviveu a
   * uma reescrita porque a reescrita acrescentou o bloco novo três linhas
   * abaixo em vez de apagar o velho, e por um tempo os dois ficaram no mesmo
   * arquivo, um dizendo no passado que o outro era falso. Comentário que
   * descreve o que não existe é da mesma família da âncora que envelhece.) */
  /* O RETÂNGULO DE TAPAR SAI NO PAPEL, e até agora isto não estava medido.
   *
   *   Arranjo:   a MESMA folha em três versões, todas geradas pelo pdf.js de
   *              hoje: sem imagem, com a imagem, e com a imagem mais um
   *              retângulo de tapar exatamente em cima dela.
   *   Afirmação: o ramo do tapar pinta o retângulo na página impressa, e o que
   *              ele pinta APAGA o que a imagem tinha pintado ali.
   *
   * As duas frases falam do mesmo arranjo. A escrita anterior não falava: ela
   * gerava a folha do fixture, que não tem item `tapar` NENHUM, e um documento
   * sem folha, e daí afirmava coisas sobre o retângulo. O ramo do `itens !== null`
   * era código morto e o comentário descrevia três documentos e uma placa de
   * controle que o código não construía. A mudança do pdf.js desta frente
   * entrava sem uma medida sequer. Foi uma lente cega que apontou.
   *
   * Dois alvos, e são eles que impedem o número de querer dizer outra coisa:
   * a imagem TEM de mudar a página (senão não há o que tapar), e a página
   * comparada com ela mesma TEM de dar zero (senão o medidor acusa sempre).
   *
   * AS TRÊS VERSÕES SÃO GERADAS DO MESMO JEITO, e a base difere das outras só
   * na lista de itens. A primeira escrita gerava a folha de referência com o
   * mapa de imagens ausente e as comparadas com ele presente, ou seja, a base
   * diferia por algo além do que estava em disputa. Fixture assimétrico pelo
   * lado errado, achado pelo conferidor cego de arranjo. */
  console.log('\n=== O retângulo de tapar sai no papel ===');
  const FOLHA_SO_IMAGEM = [{ t: 'imagem', ref: 'recorte-1', x: 60, y: 120, w: 600, h: 300 }];
  const FOLHA_COM_TAPAR = FOLHA_SO_IMAGEM.concat([{ t: 'tapar', x: 60, y: 120, w: 600, h: 300 }]);
  const bVazia = geraComTapar(pdfHoje, [], true);
  const bImagem = geraComTapar(pdfHoje, FOLHA_SO_IMAGEM, true);
  const bTapada = geraComTapar(pdfHoje, FOLHA_COM_TAPAR, true);
  const pgNota = 1;   // o documento é resumo + folha, e a folha é a segunda
  const dImagem = difDePixel(bVazia, bImagem, pgNota, tmp, 'img');
  const dTapada = difDePixel(bVazia, bTapada, pgNota, tmp, 'tap');
  /* O ALVO DE VERDADE, E POR QUE O ANTERIOR ERA MENTIRA.
   *
   * Aqui havia `difDePixel(bImagem, bImagem)`, um buffer comparado com ELE
   * MESMO, rotulado "ALVO". Aquilo não podia falhar para dado nenhum: media
   * determinismo do rasterizador, nunca capacidade de acusar. E nasceu dentro
   * da prova construída justamente para ter alvo, ou seja, a exigência foi
   * cumprida na letra e vazia no conteúdo. Achado por uma lente cega.
   *
   * O alvo agora é um par de verdade, e são dois, um de cada lado:
   *
   *   NÃO PODE ACUSAR: a mesma folha gerada DUAS VEZES, em duas chamadas
   *   separadas, com bytes diferentes (a data de criação muda) e desenho igual.
   *   Se o medidor acusasse aqui, ele acusaria em qualquer lugar.
   *
   *   TEM DE ACUSAR, E QUANTO: um retângulo de tamanho CONHECIDO sobre a
   *   imagem. Um tapar de 200 por 100 pontos de folha cobre um quarto da área
   *   do de 600 por 300, então tem de apagar bem menos que o grande e bem mais
   *   que nada. Zero aqui seria medidor cego; o valor do grande seria medidor
   *   que não distingue tamanho. */
  const bOutraVez = geraComTapar(pdfHoje, FOLHA_SO_IMAGEM, true);
  const dMesma = difDePixel(bImagem, bOutraVez, pgNota, tmp, 'mesma');
  const FOLHA_TAPAR_PEQUENO = FOLHA_SO_IMAGEM.concat([{ t: 'tapar', x: 60, y: 120, w: 200, h: 100 }]);
  const dPequeno = difDePixel(bVazia, geraComTapar(pdfHoje, FOLHA_TAPAR_PEQUENO, true), pgNota, tmp, 'peq');
  console.log('   pixels: folha vazia contra com imagem ' + JSON.stringify(dImagem.diferentes) +
    ', contra imagem tapada ' + JSON.stringify(dTapada.diferentes) +
    ', tapar pequeno ' + JSON.stringify(dPequeno.diferentes) +
    ', a mesma folha gerada duas vezes ' + JSON.stringify(dMesma.diferentes));
  conf('o rasterizador mediu as quatro', !dImagem.erro && !dTapada.erro && !dMesma.erro && !dPequeno.erro, true);
  conf('ALVO: a imagem pinta a página, senão não haveria o que tapar', dImagem.diferentes > 1000, true);
  conf('ALVO que NÃO pode acusar: a mesma folha gerada duas vezes dá zero pixel de diferença',
    dMesma.diferentes, 0);
  conf('ALVO que TEM de acusar, e quanto: um retângulo menor apaga MENOS que o grande',
    dPequeno.diferentes > dTapada.diferentes, true);
  conf('e apaga alguma coisa, senão o medidor não distinguiria tamanho nenhum',
    dPequeno.diferentes < dImagem.diferentes, true);
  /* O TETO, E DE ONDE ELE VEM. Esta medida imprimia o número e não cobrava
   * nada: régua que mede e não cobra é régua que envelhece calada, e um
   * contorno desenhado no gerador de PDF amanhã passaria por aqui sem ruído.
   *
   * O teto NÃO sai do resultado observado, que seria a circularidade de
   * sempre. Ele sai de onde precisa acusar: o perímetro deste retângulo (600
   * por 300 pontos de folha) pesa perto de um centésimo da área que ele cobre,
   * cerca de 1.800 pixels a 200 dpi, então QUALQUER contorno empurra o
   * resultado de 2.576 para bem acima disso. Medido com o veneno, um traço de
   * um ponto leva a sobra a 6.455.
   *
   * 3.200 fica com FOLGA DE MEDIDA de 624 pixels acima do observado (24 por
   * cento, que absorve variação de rasterização e de antisserrilhado) e com
   * FOLGA DE ACUSAÇÃO de 3.255 pixels abaixo do que ele tem de pegar (metade do
   * valor envenenado). As duas folgas ficam escritas aqui para que, daqui a um ano,
   * ninguém precise adivinhar se o número é limiar ou lembrança. */
  const TETO_SOBRA = 3200;
  if (VENENO_TAPAR) {
    conf('VENENO: sem o laço do tapar, o retângulo não sai no papel e a página fica igual à de só imagem',
      dTapada.diferentes, dImagem.diferentes);
  } else if (VENENO_CONTORNO) {
    conf('VENENO: com contorno desenhado no papel, a sobra estoura o teto',
      dTapada.diferentes > TETO_SOBRA, true);
    console.log('   A ASSERÇÃO DO CASO NORMAL REPROVARIA ASSIM:');
    console.log('   FALHA e o que sobra fica abaixo do teto de ' + TETO_SOBRA +
      '  [obtido: ' + dTapada.diferentes + ' | esperado: <= ' + TETO_SOBRA + ']');
  } else if (VENENO_ORDEM) {
    console.log('   (a corrida da ordem não julga o tapar: o veneno dela é das camadas)');
  } else {
    conf('o retângulo APAGA o que a imagem tinha pintado: sobra menos do que sem ele',
      dTapada.diferentes < dImagem.diferentes, true);
    conf('e o que sobra fica abaixo do teto de ' + TETO_SOBRA,
      dTapada.diferentes <= TETO_SOBRA, true);
  }

  console.log('\n=== A folha da aula não leva marca d\'água ===');
  /* A SEGUNDA LENTE CEGA DO PR #57 APONTOU UM DEFEITO QUE O CÓDIGO NÃO TEM, e
   * a medida é o que separa as duas coisas.
   *
   * A acusação: o retângulo do `tapar` era emitido em operador cru, fora do
   * `retangulo()`, e portanto não entrava em `pag.brancos`; seria então a única
   * placa branca do gerador que não corta a palavra da marca d'água que ela
   * fatia, deixando pedaço de letra impresso. O raciocínio está certo e a
   * premissa não: a página da folha nasce com `semMarca: true`, ou seja, a
   * folha da aula NÃO TEM marca d'água para cortar. E no material da biblioteca
   * a marca vai POR CIMA, com mistura multiplicativa, por um caminho que nem
   * consulta `pag.brancos`.
   *
   * A régua conta a palavra da marca no fluxo, e o ALVO onde ela TEM de achar é
   * o próprio documento: a página do resumo leva marca, a da folha não. Sem
   * esse par, "zero na folha" não se distinguiria de um contador quebrado.
   *
   * O `tapar` passou a ir pelo `retangulo()` mesmo assim, porque placa branca
   * se anota por regra deste módulo e não por necessidade de hoje, e porque
   * junto vem o `q`/`Q` que faltava. Mas a conta de "conserta um defeito" não
   * podia ficar escrita, porque o defeito não existia. */
  /* A palavra aparece no cabeçalho de TODA página e, de novo, na marca d'água
   * das páginas que a têm. Por isso a medida é um DELTA entre dois documentos
   * iguais menos a folha: se a folha trouxesse marca, a palavra cresceria duas
   * vezes (o cabeçalho e a marca) em vez de uma. */
  function conta(buf) {
    const s = Buffer.from(buf).toString('latin1');
    return {
      paginas: (s.match(/\/Type\s*\/Page[^s]/g) || []).length,
      palavras: (s.match(/APOIO EDUCACIONAL/g) || []).length
    };
  }
  const comFolha = conta(geraCom(pdfHoje));
  const semFolha = conta(geraComTapar(pdfHoje, null));
  console.log('   sem a folha: ' + JSON.stringify(semFolha) + ', com a folha: ' + JSON.stringify(comFolha));
  conf('o documento sem a folha TEM marca d\'água, senão a régua não mediria nada',
    semFolha.palavras > semFolha.paginas, true);
  conf('a folha acrescenta exatamente uma página', comFolha.paginas - semFolha.paginas, 1);
  conf('e acrescenta só o cabeçalho dela, e nenhuma marca d\'água',
    comFolha.palavras - semFolha.palavras, 1);

  if (PROVA) {
    if (!fs.existsSync(PROVA) || !fs.statSync(PROVA).isDirectory()) {
      console.log('   a pasta da prova não existe, e este roteiro não cria pasta: ' + PROVA);
      falhas++;
    } else {
      fs.copyFileSync(path.join(tmp, 'hoje.pdf'), path.join(PROVA, 'fixture_da_prova_folha.pdf'));
      console.log('   fixture_da_prova_folha.pdf e fixture_da_prova_folha.png');
    }
  }

  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
